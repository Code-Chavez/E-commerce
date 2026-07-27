import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../app';

// Mock Prisma client
jest.mock('@infrastructure/database/prisma', () => {
  const mockProductVariant = {
    findMany: jest.fn(),
  };

  const mockBranchStock = {
    findMany: jest.fn(),
  };

  const mockPrisma: any = {
    productVariant: mockProductVariant,
    branchStock: mockBranchStock,
  };
  return { __esModule: true, default: mockPrisma };
});


// Mock Auth Middleware
jest.mock('@infrastructure/http/middlewares/auth.middleware', () => ({
  requirePermission: jest.fn(() => (req: any, res: any, next: any) => { req.auth = { userId: 1, branchId: 1, role: 'ADMIN' }; next(); }), requireAuth: jest.fn((req: any, res: any, next: any) => { req.auth = { userId: 1, branchId: 1, role: 'ADMIN' }; next(); }), optionalAuth: jest.fn((req: any, res: any, next: any) => next()),
}));

import prisma from '@infrastructure/database/prisma';
import { GetStockReportUseCase } from '@application/use-cases/inventory/GetStockReportUseCase';

describe('HU-021: Inventory View', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get global stock successfully (Happy Path)', async () => {
    (prisma.productVariant.findMany as jest.Mock).mockResolvedValue([
      { 
        id: 1, 
        sku: 'PROD-1', 
        product: { name: 'Prod 1' }, 
        branchStock: [{ branchId: 1, quantity: 10, branch: { name: 'Main Branch' } }] 
      }
    ] as never);

    const response = await request(app).get('/api/v1/stock');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data[0].sku).toBe('PROD-1');
  });

  it('should return empty array if no stock found (Happy Path)', async () => {
    (prisma.productVariant.findMany as jest.Mock).mockResolvedValue([] as never);

    const response = await request(app).get('/api/v1/stock');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });

  it('should handle database errors gracefully (Error Case)', async () => {
    (prisma.productVariant.findMany as jest.Mock).mockRejectedValue(new Error('DB connection failed') as never);

    const response = await request(app).get('/api/v1/stock');

    expect(response.status).toBeGreaterThanOrEqual(500);
    expect(response.body.success).toBe(false);
  });
});


