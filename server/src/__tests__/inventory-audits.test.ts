import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../app';

// Mock Prisma client
jest.mock('@infrastructure/database/prisma', () => {
  const mockInventoryAudit = {
    create: jest.fn(),
  };

  const mockBranchStock = {
    findFirst: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn().mockResolvedValue({ quantity: 10 } as never),
  };

  const mockBranch = {
    findUnique: jest.fn().mockResolvedValue({ id: 1, name: 'Main' } as never),
  };

  const mockProductVariant = {
    findUnique: jest.fn().mockResolvedValue({ id: 10, sku: 'SKU10' } as never),
  };

  const mockKardex = {
    create: jest.fn(),
  };

  const mockPrisma: any = {
    inventoryAudit: mockInventoryAudit,
    branchStock: mockBranchStock,
    branch: mockBranch,
    productVariant: mockProductVariant,
    kardex: mockKardex,
    $transaction: jest.fn().mockImplementation(async (cb: any) => {
      if (Array.isArray(cb)) return Promise.all(cb);
      return cb(mockPrisma);
    }),
  };
  return { __esModule: true, default: mockPrisma };
});

// Mock Auth Middleware
jest.mock('@infrastructure/http/middlewares/auth.middleware', () => ({
  requirePermission: jest.fn(() => (req: any, res: any, next: any) => {
    req.auth = { userId: 1, branchId: 1, role: 'ADMIN' };
    next();
  }),
  requireAuth: jest.fn((req: any, res: any, next: any) => {
    req.auth = { userId: 1, branchId: 1, role: 'ADMIN' };
    next();
  }),
  optionalAuth: jest.fn((req: any, res: any, next: any) => next()),
}));

import prisma from '@infrastructure/database/prisma';
import { CreateInventoryAuditUseCase } from '@application/use-cases/inventory/CreateInventoryAuditUseCase';

describe('Inventory Audits API (HU-029)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register a physical inventory audit successfully (Happy Path)', async () => {
    (prisma.inventoryAudit.create as jest.Mock).mockResolvedValue({
      id: 1,
      branchId: 1,
      status: 'PENDING',
      items: [
        {
          id: 1,
          auditId: 1,
          variantId: 10,
          physicalQty: 50,
          systemQty: 10,
          difference: 40,
        },
      ],
    } as never);

    const payload = {
      branchId: 1,
      status: 'PENDING',
      items: [{ variantId: 10, physicalQty: 50 }],
    };

    const response = await request(app)
      .post('/api/v1/inventory-audits')
      .send(payload);

    if (response.status === 500) {
      console.log('Error 500 body:', response.body);
    }

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id', 1);
  });

  it('should return 400 if validation fails on negative quantities (Error Case)', async () => {
    const payload = {
      branchId: 1,
      status: 'PENDING',
      items: [{ variantId: 10, physicalQty: -5 }],
    };

    const response = await request(app)
      .post('/api/v1/inventory-audits')
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.errors[0].message).toContain('no puede ser negativa');
  });

  it('should return 404 if variant does not exist (Error Case)', async () => {
    (prisma.$transaction as jest.Mock).mockRejectedValue(
      new Error('Variante con ID 99 no existe') as never
    );

    const payload = {
      branchId: 1,
      status: 'CONFIRMED',
      items: [{ variantId: 99, physicalQty: 10 }],
    };

    const response = await request(app)
      .post('/api/v1/inventory-audits')
      .send(payload);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('no existe');
  });
});
