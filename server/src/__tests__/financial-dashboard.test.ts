import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../app';

// 1. Mock Prisma client
jest.mock('@infrastructure/database/prisma', () => {
  const mockOrder = {
    findMany: jest.fn(),
  };
  const mockPosOrder = {
    findMany: jest.fn(),
  };
  const mockUser = {
    findUnique: jest.fn(),
  };

  const mockPrisma: any = {
    order: mockOrder,
    posOrder: mockPosOrder,
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

// 2. Mock JwtService
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
import { FinancialConsolidationService } from '@domain/services/FinancialConsolidationService';

describe('Tests de Dashboard Financiero Consolidado Multi-canal (HU-070)', () => {
  const dummyAdminUser = {
    id: 1,
    email: 'admin@dmendoza.com',
    isActive: true,
    roles: [
      {
        name: 'ADMIN',
        permissions: [{ name: 'sales:read' }],
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.user.findUnique as any).mockResolvedValue(dummyAdminUser);
  });

  describe('FinancialConsolidationService (Unit Test)', () => {
    const service = new FinancialConsolidationService();

    it('debe consolidar correctamente las ventas y calcular diferencias y porcentajes', () => {
      const currentSales = [
        { amount: 100, channel: 'ECOMMERCE' as const, branchId: null, branchName: 'Venta Online' },
        { amount: 200, channel: 'POS' as const, branchId: 1, branchName: 'Sede Miraflores' },
        { amount: 150, channel: 'POS' as const, branchId: 2, branchName: 'Sede San Isidro' },
      ];

      const previousSales = [
        { amount: 80, channel: 'ECOMMERCE' as const, branchId: null, branchName: 'Venta Online' },
        { amount: 180, channel: 'POS' as const, branchId: 1, branchName: 'Sede Miraflores' },
        { amount: 100, channel: 'POS' as const, branchId: 2, branchName: 'Sede San Isidro' },
      ];

      const result = service.consolidate(currentSales, previousSales);

      expect(result.currentPeriod.totalRevenue).toBe(450);
      expect(result.currentPeriod.posRevenue).toBe(350);
      expect(result.currentPeriod.ecommerceRevenue).toBe(100);
      expect(result.currentPeriod.revenueByBranch).toEqual([
        { branchId: 1, branchName: 'Sede Miraflores', total: 200 },
        { branchId: 2, branchName: 'Sede San Isidro', total: 150 },
        { branchId: null, branchName: 'Venta Online', total: 100 },
      ]);

      expect(result.previousPeriod.totalRevenue).toBe(360);
      expect(result.comparison.revenueDifference).toBe(90);
      expect(result.comparison.revenuePercentageChange).toBe(25); // (90 / 360) * 100 = 25%
    });
  });

  describe('GET /api/v1/admin/reports/financial-dashboard', () => {
    it('debe retornar HTTP 200 y el dashboard consolidado con filtros de fecha', async () => {
      // Mock current period
      (prisma.order.findMany as any).mockResolvedValueOnce([
        { total: 500, createdAt: new Date() },
      ]);
      (prisma.posOrder.findMany as any).mockResolvedValueOnce([
        { total: 1500, createdAt: new Date(), branchId: 1, branch: { name: 'Sede Principal' } },
      ]);

      // Mock previous period
      (prisma.order.findMany as any).mockResolvedValueOnce([
        { total: 400, createdAt: new Date() },
      ]);
      (prisma.posOrder.findMany as any).mockResolvedValueOnce([
        { total: 1200, createdAt: new Date(), branchId: 1, branch: { name: 'Sede Principal' } },
      ]);

      const response = await request(app)
        .get('/api/v1/admin/reports/financial-dashboard?from=2026-06-01&to=2026-06-30')
        .set('Authorization', 'Bearer dummy-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.currentPeriod.totalRevenue).toBe(2000);
      expect(response.body.data.currentPeriod.posRevenue).toBe(1500);
      expect(response.body.data.currentPeriod.ecommerceRevenue).toBe(500);
      expect(response.body.data.previousPeriod.totalRevenue).toBe(1600);
      expect(response.body.data.comparison.revenueDifference).toBe(400);
      expect(response.body.data.comparison.revenuePercentageChange).toBe(25);
    });

    it('debe retornar HTTP 400 si el formato de fecha es incorrecto', async () => {
      const response = await request(app)
        .get('/api/v1/admin/reports/financial-dashboard?from=invalid-date')
        .set('Authorization', 'Bearer dummy-token');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error[0].message).toContain('YYYY-MM-DD');
    });

    it('debe retornar HTTP 403 si falta el permiso sales:read', async () => {
      const dummyClientUser = {
        id: 2,
        email: 'client@example.com',
        isActive: true,
        roles: [
          {
            name: 'CLIENT',
            permissions: [],
          },
        ],
      };
      (prisma.user.findUnique as any).mockResolvedValue(dummyClientUser);

      const response = await request(app)
        .get('/api/v1/admin/reports/financial-dashboard')
        .set('Authorization', 'Bearer dummy-token');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('success', false);
    });
  });
});


