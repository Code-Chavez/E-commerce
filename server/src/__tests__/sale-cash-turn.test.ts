import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../app';
import prisma from '@infrastructure/database/prisma';

// Mock Prisma
jest.mock('@infrastructure/database/prisma', () => {
  return {
    __esModule: true,
    default: {
      $transaction: jest.fn(async (cb: any) =>
        cb({
          branchStock: {
            findUnique: jest.fn().mockResolvedValue({ quantity: 100 } as never),
            update: jest.fn(),
            upsert: jest.fn(),
          },
          posOrder: {
            create: jest.fn().mockResolvedValue({
              id: 1,
              branchId: 1,
              total: 100,
              cashTurnId: 1,
            } as never),
          },
          payment: {
            createMany: jest.fn(),
          },
          kardexEntry: {
            findFirst: jest.fn().mockResolvedValue(null as never),
            create: jest.fn(),
          },
          loyaltyConfig: {
            findFirst: jest.fn().mockResolvedValue(null as never),
          },
        })
      ),
      cashTurn: {
        findFirst: jest.fn(),
      },
    },
  };
});

// Mock Auth Middleware
jest.mock('@infrastructure/http/middlewares/auth.middleware', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.auth = { userId: 1, role: 'SELLER', branchId: 1 };
    next();
  },
  requirePermission: () => (req: any, res: any, next: any) => {
    req.auth = { userId: 1, role: 'SELLER', branchId: 1 };
    next();
  },
  optionalAuth: (req: any, res: any, next: any) => {
    req.auth = { userId: 1, role: 'SELLER', branchId: 1 };
    next();
  },
}));

describe('Sale POS - Cash Turn Validation (HU-032)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe rechazar con HTTP 403 si el vendedor no tiene turno de caja abierto', async () => {
    // Simular que no hay turno abierto
    (prisma.cashTurn.findFirst as jest.Mock).mockResolvedValueOnce(
      null as never
    );

    const payload = {
      branchId: 1,
      items: [{ variantId: 1, quantity: 1, unitPrice: 100 }],
      payments: [{ method: 'CASH', amount: 100 }],
      subtotal: 100,
      discountTotal: 0,
      total: 100,
    };

    const response = await request(app).post('/api/v1/pos/sales').send(payload);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain(
      'No tienes un turno de caja abierto para registrar ventas'
    );
  });

  it('debe registrar la venta con HTTP 201 y asociarla al turno si existe turno abierto', async () => {
    // Simular que hay turno abierto
    (prisma.cashTurn.findFirst as jest.Mock).mockResolvedValueOnce({
      id: 99,
      status: 'OPEN',
      userId: 1,
    } as never);

    const payload = {
      branchId: 1,
      items: [{ variantId: 1, quantity: 1, unitPrice: 100 }],
      payments: [{ method: 'CASH', amount: 100 }],
      subtotal: 100,
      discountTotal: 0,
      total: 100,
    };

    const response = await request(app).post('/api/v1/pos/sales').send(payload);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.cashTurnId).toBe(1);
    expect(prisma.cashTurn.findFirst).toHaveBeenCalledWith({
      where: { userId: 1, status: 'OPEN' },
    });
  });
});
