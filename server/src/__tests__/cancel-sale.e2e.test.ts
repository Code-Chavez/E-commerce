import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import bcrypt from 'bcrypt';

// Mock JWT verification
const mockVerifyAccessToken = jest.fn();
jest.mock('@infrastructure/services/JwtService', () => ({
  JwtService: jest.fn().mockImplementation(() => ({
    verifyAccessToken: (...args: any[]) => mockVerifyAccessToken(...args),
  })),
}));

// Mock Prisma
jest.mock('@infrastructure/database/prisma', () => ({
  __esModule: true,
  default: {
    posOrder: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    branchStock: {
      update: jest.fn(),
    },
    kardexEntry: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn((callback: any) =>
      callback(require('@infrastructure/database/prisma').default)
    ),
  },
}));

import app from '../app';
import prisma from '@infrastructure/database/prisma';

describe('Anulación de Venta (E2E) - HU-038', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PATCH /api/v1/pos/sales/:id/cancel', () => {
    it('debería retornar 401 si no hay usuario autenticado', async () => {
      mockVerifyAccessToken.mockImplementation(() => {
        throw new Error('Token inválido');
      });

      const res = await request(app).patch('/api/v1/pos/sales/1/cancel');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('debería anular la venta directamente si el usuario es ADMIN', async () => {
      mockVerifyAccessToken.mockReturnValue({
        userId: 1,
        role: 'ADMIN',
      });
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 1,
        isActive: true,
        roles: [{ name: 'ADMIN' }],
      });

      (prisma.posOrder.findUnique as any).mockResolvedValue({
        id: 1,
        status: 'COMPLETED',
        branchId: 1,
        items: [
          { variantId: 1, quantity: 2 },
          { variantId: 2, quantity: 1 },
        ],
      });

      (prisma.kardexEntry.findFirst as any).mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/v1/pos/sales/1/cancel')
        .set('Authorization', 'Bearer admin_token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('CANCELLED');
      expect(res.body.data.itemsReversed).toBe(2);

      // Verify stock reversion
      expect(prisma.branchStock.update).toHaveBeenCalledTimes(2);
      expect(prisma.kardexEntry.create).toHaveBeenCalledTimes(2);
    });

    it('debería requerir credenciales de admin si el usuario es SELLER', async () => {
      mockVerifyAccessToken.mockReturnValue({
        userId: 2,
        role: 'SELLER',
      });
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 2,
        isActive: true,
        roles: [{ name: 'SELLER' }],
      });

      (prisma.posOrder.findUnique as any).mockResolvedValue({
        id: 1,
        status: 'COMPLETED',
        branchId: 1,
        items: [],
      });

      const res = await request(app)
        .patch('/api/v1/pos/sales/1/cancel')
        .set('Authorization', 'Bearer seller_token')
        .send({}); // No admin credentials

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('autorización de un administrador');
    });

    it('debería permitir anulación si SELLER provee credenciales correctas de ADMIN', async () => {
      mockVerifyAccessToken.mockReturnValue({
        userId: 2,
        role: 'SELLER',
      });

      const hashedPass = await bcrypt.hash('adminpass', 10);
      (prisma.user.findUnique as any).mockImplementation((args: any) => {
        if (args.where.email === 'admin@test.com') {
          return Promise.resolve({
            id: 1,
            email: 'admin@test.com',
            isActive: true,
            password: hashedPass,
            roles: [{ name: 'ADMIN' }],
          });
        }
        return Promise.resolve({
          id: 2,
          isActive: true,
          roles: [{ name: 'SELLER' }],
        });
      });

      (prisma.posOrder.findUnique as any).mockResolvedValue({
        id: 1,
        status: 'COMPLETED',
        branchId: 1,
        items: [{ variantId: 1, quantity: 1 }],
      });

      (prisma.kardexEntry.findFirst as any).mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/v1/pos/sales/1/cancel')
        .set('Authorization', 'Bearer seller_token')
        .send({
          adminEmail: 'admin@test.com',
          adminPassword: 'adminpass',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('CANCELLED');
    });
  });
});
