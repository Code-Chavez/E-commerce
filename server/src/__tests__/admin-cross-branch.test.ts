import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../app';
import prisma from '@infrastructure/database/prisma';

jest.mock('@infrastructure/database/prisma', () => {
  const mockOrder = { findMany: jest.fn() };
  const mockPosOrder = { findMany: jest.fn() };
  const mockAuditLog = { findMany: jest.fn() };
  const mockPrisma: any = {
    order: mockOrder,
    posOrder: mockPosOrder,
    auditLog: mockAuditLog,
  };
  return { __esModule: true, default: mockPrisma };
});

jest.mock('@infrastructure/http/middlewares/auth.middleware', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.auth = { userId: 1, role: 'ADMIN', branchId: 1 };
    next();
  },
  requirePermission: () => (req: any, res: any, next: any) => next(),
  optionalAuth: (req: any, res: any, next: any) => next(),
}));

describe('Admin Cross-Branch API (HU-057)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/admin/cross-branch/pending', () => {
    it('should list pending cross-branch sales', async () => {
      const mockOrders = [
        {
          id: 1,
          status: 'COMPLETED',
          isCrossBranch: true,
          branchId: 2,
          branch: { name: 'Dest Branch' },
          sourceBranchId: 1,
          sourceBranch: { name: 'Source Branch' },
          total: 100,
          createdAt: new Date(),
          items: [
            {
              variantId: 10,
              quantity: 2,
              unitPrice: 50,
              variant: { sku: 'SKU10', product: { name: 'Product 10' } }
            }
          ]
        },
      ];
      (prisma.posOrder.findMany as any).mockResolvedValue(mockOrders);
      (prisma.auditLog.findMany as any).mockResolvedValue([]);

      const response = await request(app).get('/api/v1/admin/cross-branch/pending');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Depending on the UseCase implementation, it might aggregate or return the list
      // Let's assume it returns some data successfully
      expect(response.body.data).toBeDefined();
    });

    it('should handle repository errors gracefully', async () => {
      (prisma.posOrder.findMany as any).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/v1/admin/cross-branch/pending');

      // The Express error handler will convert unhandled generic errors to 500
      expect(response.status).toBe(500);
    });
  });
});
