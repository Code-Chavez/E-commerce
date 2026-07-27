import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../app';
import { Readable } from 'stream';
import prisma from '@infrastructure/database/prisma';

// Mock PdfKitShippingLabelService
jest.mock('@infrastructure/services/PdfKitShippingLabelService', () => {
  return {
    PdfKitShippingLabelService: jest.fn().mockImplementation(() => {
      return {
        generateLabelPdfStream: jest.fn().mockImplementation(async () => {
          const s = new Readable();
          s.push('mock pdf shipping label content');
          s.push(null);
          return s;
        }),
      };
    }),
  };
});

// Mock Prisma Client
jest.mock('@infrastructure/database/prisma', () => {
  const mockOrder = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const mockDelivery = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const mockUser = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  };

  const mockPrisma: any = {
    order: mockOrder,
    delivery: mockDelivery,
    user: mockUser,
    $transaction: jest.fn().mockImplementation(async (args: any): Promise<any> => {
      if (typeof args === 'function') {
        return args(mockPrisma);
      }
      return args;
    }),
  };

  return { __esModule: true, default: mockPrisma };
});

// Share a mutable mock token payload. Variables prefixed with "mock" are hoisted safely by Jest.
const mockTokenPayload = {
  userId: 1,
  email: 'admin@example.com',
  role: 'ADMIN',
};

// Mock JwtService for requireAuth
jest.mock('@infrastructure/services/JwtService', () => ({
  JwtService: jest.fn().mockImplementation(() => ({
    verifyAccessToken: jest.fn().mockImplementation(() => {
      return mockTokenPayload;
    }),
  })),
}));

describe('Logistics Endpoints', () => {
  let userMockDb: Record<number, any> = {};

  beforeEach(() => {
    jest.clearAllMocks();

    // Default token payload
    mockTokenPayload.userId = 1;
    mockTokenPayload.email = 'admin@example.com';
    mockTokenPayload.role = 'ADMIN';

    // Mock database state for users
    userMockDb = {
      1: {
        id: 1,
        email: 'admin@example.com',
        isActive: true,
        roles: [{ name: 'ADMIN' }],
      },
      2: {
        id: 2,
        email: 'supply@example.com',
        isActive: true,
        roles: [{ name: 'SUPPLY' }],
      },
      99: {
        id: 99,
        email: 'repartidor@example.com',
        isActive: true,
        roles: [{ name: 'DELIVERY' }],
      },
    };

    // Configure dynamic mock for user lookup
    (prisma.user.findUnique as any).mockImplementation((args: any) => {
      const id = args?.where?.id;
      return Promise.resolve(userMockDb[id] || null);
    });
  });

  describe('POST /api/v1/logistics/picking', () => {
    it('should generate picking list successfully with SUPPLY role', async () => {
      mockTokenPayload.userId = 2;
      mockTokenPayload.email = 'supply@example.com';
      mockTokenPayload.role = 'SUPPLY';

      const mockPaidOrders = [
        {
          id: 101,
          status: 'PAID',
          items: [{ variantId: 5, qty: 2 }],
        },
      ];

      (prisma.order.findMany as any).mockResolvedValue(mockPaidOrders);
      (prisma.delivery.create as any).mockResolvedValue({
        id: 1,
        orderId: 101,
        deliveryManId: null,
        status: 'PENDING',
        pickingItems: [{ id: 1, deliveryId: 1, variantId: 5, qty: 2, pickedAt: null }],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app)
        .post('/api/v1/logistics/picking')
        .send({ orderIds: [101] })
        .set('Authorization', 'Bearer dummy-token');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
    });

    it('should block non-admin and non-supply users', async () => {
      mockTokenPayload.role = 'CLIENT';
      userMockDb[1].roles = [{ name: 'CLIENT' }];

      const response = await request(app)
        .post('/api/v1/logistics/picking')
        .set('Authorization', 'Bearer dummy-token');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/logistics/delivery-men', () => {
    it('should return users with DELIVERY role', async () => {
      const mockUsers = [
        {
          id: 99,
          email: 'repartidor@example.com',
          name: 'Repartidor',
          lastName: '1',
          roles: [{ name: 'DELIVERY' }],
        },
      ];
      (prisma.user.findMany as any).mockResolvedValue(mockUsers);

      const response = await request(app)
        .get('/api/v1/logistics/delivery-men')
        .set('Authorization', 'Bearer dummy-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data[0].id).toBe(99);
    });
  });

  describe('GET /api/v1/logistics/deliveries', () => {
    it('should list all deliveries successfully', async () => {
      const mockDeliveries = [
        {
          id: 1,
          orderId: 101,
          deliveryManId: null,
          status: 'PENDING',
          pickingItems: [],
        },
      ];

      (prisma.delivery.findMany as any).mockResolvedValue(mockDeliveries);

      const response = await request(app)
        .get('/api/v1/logistics/deliveries')
        .set('Authorization', 'Bearer dummy-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0].id).toBe(1);
    });

    it('should list deliveries filtered by status successfully', async () => {
      const mockDeliveries = [
        {
          id: 2,
          orderId: 102,
          deliveryManId: 99,
          status: 'ASSIGNED',
          pickingItems: [],
        },
      ];

      (prisma.delivery.findMany as any).mockResolvedValue(mockDeliveries);

      const response = await request(app)
        .get('/api/v1/logistics/deliveries')
        .query({ status: 'ASSIGNED' })
        .set('Authorization', 'Bearer dummy-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(prisma.delivery.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'ASSIGNED' },
        })
      );
    });
  });

  describe('POST /api/v1/logistics/deliveries/:id/assign', () => {
    it('should assign a delivery man with role DELIVERY', async () => {
      (prisma.delivery.findUnique as any).mockResolvedValue({
        id: 1,
        orderId: 101,
        status: 'PENDING',
      });

      (prisma.delivery.update as any).mockResolvedValue({
        id: 1,
        orderId: 101,
        deliveryManId: 99,
        status: 'ASSIGNED',
      });

      const response = await request(app)
        .post('/api/v1/logistics/deliveries/1/assign')
        .send({ deliveryManId: 99 })
        .set('Authorization', 'Bearer dummy-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('ASSIGNED');
      expect(response.body.data.deliveryManId).toBe(99);
    });
  });

  describe('GET /api/v1/logistics/deliveries/:id/label', () => {
    it('should generate PDF shipping label', async () => {
      (prisma.delivery.findUnique as any).mockResolvedValue({
        id: 1,
        orderId: 101,
      });

      (prisma.order.findUnique as any).mockResolvedValue({
        id: 101,
        userId: 2,
        addressSnapshot: {
          fullAddress: 'Calle Las Flores 123',
          district: 'San Isidro',
        },
        user: {
          id: 2,
          name: 'John',
        },
      });

      const response = await request(app)
        .get('/api/v1/logistics/deliveries/1/label')
        .set('Authorization', 'Bearer dummy-token');

      expect(response.status).toBe(200);
      expect(response.header['content-type']).toBe('application/pdf');
      expect(response.header['content-disposition']).toContain('shipping-label-1.pdf');
    });
  });
  describe('PATCH /api/v1/logistics/deliveries/:id/status', () => {
    it('should update delivery status and send email on valid transition', async () => {
      (prisma.delivery.findUnique as any).mockResolvedValue({
        id: 1,
        orderId: 101,
        status: 'ASSIGNED',
      });

      (prisma.order.update as any).mockResolvedValue({
        id: 101,
        status: 'SHIPPED',
      });

      (prisma.delivery.update as any).mockResolvedValue({
        id: 1,
        orderId: 101,
        status: 'IN_TRANSIT',
        order: {
          user: {
            email: 'customer@example.com',
            name: 'Customer',
          },
        },
      });

      const response = await request(app)
        .patch('/api/v1/logistics/deliveries/1/status')
        .send({ status: 'IN_TRANSIT' })
        .set('Authorization', 'Bearer dummy-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('IN_TRANSIT');
    });

    it('should return 409 Conflict on invalid state transition', async () => {
      (prisma.delivery.findUnique as any).mockResolvedValue({
        id: 1,
        orderId: 101,
        status: 'PENDING',
      });

      const response = await request(app)
        .patch('/api/v1/logistics/deliveries/1/status')
        .send({ status: 'DELIVERED' })
        .set('Authorization', 'Bearer dummy-token');

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('No se permite la transición');
    });
  });

  describe('PATCH /api/v1/logistics/deliveries/:id/return', () => {
    it('should process delivery return and update stock on valid transition', async () => {
      (prisma.delivery.findUnique as any).mockResolvedValue({
        id: 1,
        orderId: 101,
        status: 'FAILED',
        order: {
          id: 101,
          items: [{ variantId: 5, qty: 2 }]
        }
      });
      (prisma.delivery.update as any).mockResolvedValue({
        id: 1,
        orderId: 101,
        status: 'RETURNED'
      });
      
      const mockBranchStock = {
        findUnique: jest.fn<any>().mockResolvedValue({ id: 10, quantity: 5 }),
        update: jest.fn<any>().mockResolvedValue(true),
        create: jest.fn<any>()
      };
      
      const mockBranch = {
        findFirst: jest.fn<any>().mockResolvedValue({ id: 1 } as never)
      };
      
      const mockKardex = {
        findFirst: jest.fn<any>().mockResolvedValue({ unitCost: 10, balanceCost: 50 }),
        create: jest.fn<any>().mockResolvedValue(true as never)
      };

      const mockOrderStatusLog = {
        create: jest.fn<any>().mockResolvedValue(true as never)
      };

      (prisma as any).branchStock = mockBranchStock;
      (prisma as any).branch = mockBranch;
      (prisma as any).kardexEntry = mockKardex;
      (prisma as any).orderStatusLog = mockOrderStatusLog;

      const response = await request(app)
        .patch('/api/v1/logistics/deliveries/1/return')
        .set('Authorization', 'Bearer dummy-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockBranchStock.update).toHaveBeenCalledWith(expect.objectContaining({
        data: { quantity: 7 }
      }));
      expect(mockKardex.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ type: 'DEVOLUCION', quantity: 2, unitCost: 10 })
      }));
    });
  });
});


