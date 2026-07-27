import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../app';

// 1. Mock Stripe SDK
jest.mock('stripe', () => {
  const singletonMock = {
    paymentIntents: {
      list: jest.fn(),
    },
  };
  return jest.fn().mockImplementation(() => singletonMock);
});

const mockStripeInstance = require('stripe')();

// 2. Mock Prisma client
jest.mock('@infrastructure/database/prisma', () => {
  const mockOrder = {
    findMany: jest.fn(),
  };
  const mockUser = {
    findUnique: jest.fn(),
  };

  const mockPrisma: any = {
    order: mockOrder,
    user: mockUser,
    $transaction: jest.fn().mockImplementation(async (args: any): Promise<any> => {
      if (Array.isArray(args)) {
        return Promise.all(args);
      }
      if (typeof args === 'function') {
        return args(mockPrisma);
      }
      return args;
    }),
  };

  return { __esModule: true, default: mockPrisma };
});

// 3. Mock JwtService
jest.mock('@infrastructure/services/JwtService', () => ({
  JwtService: jest.fn().mockImplementation(() => ({
    verifyAccessToken: jest.fn().mockReturnValue({
      userId: 1,
      email: 'admin@dmendoza.com',
      role: 'ADMIN',
    }),
  })),
}));

import prisma from '@infrastructure/database/prisma';

describe('Tests de Integración — HU-073: Conciliación de Transacciones (T-209)', () => {
  const dummyAdminUser = {
    id: 1,
    email: 'admin@dmendoza.com',
    isActive: true,
    roles: [
      {
        name: 'ADMIN',
        permissions: [
          { name: 'roles:manage' },
        ],
      },
    ],
  };

  const dummyOrdersInDb = [
    {
      id: 101,
      paymentIntentId: 'pi_matched_1',
      total: 150.00,
      status: 'PAID',
      createdAt: new Date('2026-06-25T10:00:00Z'),
    },
    {
      id: 102,
      paymentIntentId: 'pi_mismatch_2',
      total: 195.00, // DB order total: 195.00, Stripe total will be 200.00
      status: 'PAID',
      createdAt: new Date('2026-06-25T11:00:00Z'),
    },
    {
      id: 103,
      paymentIntentId: 'pi_db_only_4',
      total: 80.00, // Exists in DB but not in Stripe list
      status: 'PAID',
      createdAt: new Date('2026-06-25T12:00:00Z'),
    },
    {
      id: 104,
      paymentIntentId: 'pi_db_only_cancelled',
      total: 60.00, // Exists in DB but not in Stripe, and is CANCELLED (should be ignored from dbOnly discrepancies)
      status: 'CANCELLED',
      createdAt: new Date('2026-06-25T13:00:00Z'),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.user.findUnique as any).mockResolvedValue(dummyAdminUser);
  });

  it('debería realizar la conciliación correctamente y devolver matched y unmatched', async () => {
    // Mock Stripe response (using async iterator)
    const mockStripeIntents = [
      {
        id: 'pi_matched_1',
        amount: 15000, // 150.00
        currency: 'pen',
        status: 'succeeded',
        created: Math.floor(new Date('2026-06-25T10:00:00Z').getTime() / 1000),
      },
      {
        id: 'pi_mismatch_2',
        amount: 20000, // 200.00 (vs 195.00 in DB)
        currency: 'pen',
        status: 'succeeded',
        created: Math.floor(new Date('2026-06-25T11:00:00Z').getTime() / 1000),
      },
      {
        id: 'pi_stripe_only_3',
        amount: 5000, // 50.00 (not in DB)
        currency: 'pen',
        status: 'succeeded',
        created: Math.floor(new Date('2026-06-25T12:00:00Z').getTime() / 1000),
      },
      {
        id: 'pi_not_succeeded_ignored',
        amount: 9000, // requires action, not succeeded, so ignored from stripeOnly discrepancies
        currency: 'pen',
        status: 'requires_action',
        created: Math.floor(new Date('2026-06-25T13:00:00Z').getTime() / 1000),
      },
    ];

    mockStripeInstance.paymentIntents.list.mockReturnValue({
      [Symbol.asyncIterator]: () => {
        let index = 0;
        return {
          next: () => {
            if (index < mockStripeIntents.length) {
              return Promise.resolve({ value: mockStripeIntents[index++], done: false });
            } else {
              return Promise.resolve({ value: undefined, done: true });
            }
          },
        };
      },
    });

    (prisma.order.findMany as any).mockResolvedValue(dummyOrdersInDb);

    const response = await request(app)
      .post('/api/v1/admin/reconcile/stripe')
      .set('Authorization', 'Bearer dummy-admin-token')
      .send({
        from: '2026-06-25T00:00:00.000Z',
        to: '2026-06-25T23:59:59.999Z',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const { matched, unmatched } = response.body.data;

    // Matched check
    expect(matched.length).toBe(2);
    expect(matched).toContainEqual({
      stripePaymentIntentId: 'pi_matched_1',
      orderId: 101,
      stripeAmount: 150.00,
      orderAmount: 150.00,
      status: 'MATCHED',
    });
    expect(matched).toContainEqual({
      stripePaymentIntentId: 'pi_mismatch_2',
      orderId: 102,
      stripeAmount: 200.00,
      orderAmount: 195.00,
      status: 'AMOUNT_MISMATCH',
    });

    // Unmatched: Stripe Only (succeeded only)
    expect(unmatched.stripeOnly.length).toBe(1);
    expect(unmatched.stripeOnly[0].id).toBe('pi_stripe_only_3');
    expect(unmatched.stripeOnly[0].amount).toBe(50.00);

    // Unmatched: DB Only (PAID, SHIPPED, DELIVERED only)
    expect(unmatched.dbOnly.length).toBe(1);
    expect(unmatched.dbOnly[0].id).toBe(103);
    expect(unmatched.dbOnly[0].paymentIntentId).toBe('pi_db_only_4');
  });

  it('debería retornar HTTP 400 si las fechas son inválidas', async () => {
    const response = await request(app)
      .post('/api/v1/admin/reconcile/stripe')
      .set('Authorization', 'Bearer dummy-admin-token')
      .send({
        from: 'not-a-date',
        to: '2026-06-25T23:59:59.999Z',
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.errors[0].field).toBe('from');
  });

  it('debería retornar HTTP 400 si "from" es posterior a "to"', async () => {
    const response = await request(app)
      .post('/api/v1/admin/reconcile/stripe')
      .set('Authorization', 'Bearer dummy-admin-token')
      .send({
        from: '2026-06-26T00:00:00.000Z',
        to: '2026-06-25T23:59:59.999Z',
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.errors[0].field).toBe('from');
  });

  it('debería denegar acceso con HTTP 403 si el usuario carece del permiso roles:manage', async () => {
    const dummySellerUser = {
      id: 2,
      email: 'seller@dmendoza.com',
      isActive: true,
      roles: [
        {
          name: 'SELLER',
          permissions: [],
        },
      ],
    };
    (prisma.user.findUnique as any).mockResolvedValue(dummySellerUser);

    const response = await request(app)
      .post('/api/v1/admin/reconcile/stripe')
      .set('Authorization', 'Bearer dummy-seller-token')
      .send({
        from: '2026-06-25T00:00:00.000Z',
        to: '2026-06-25T23:59:59.999Z',
      });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('roles:manage');
  });
});


