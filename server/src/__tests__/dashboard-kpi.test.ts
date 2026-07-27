import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../app';

// 1. Mock Prisma client
jest.mock('@infrastructure/database/prisma', () => {
  const mockOrder = {
    aggregate: jest.fn(),
    count: jest.fn(),
  };
  const mockPosOrder = {
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  };
  const mockStockAlert = {
    findMany: jest.fn(),
  };
  const mockBranch = {
    findMany: jest.fn(),
  };
  const mockUser = {
    findUnique: jest.fn(),
  };

  const mockPrisma: any = {
    order: mockOrder,
    posOrder: mockPosOrder,
    stockAlert: mockStockAlert,
    branch: mockBranch,
    user: mockUser,
    $transaction: jest
      .fn()
      .mockImplementation(async (args: any): Promise<any> => {
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
      email: 'admin@e-commerce.com',
      role: 'ADMIN',
    }),
  })),
}));

import prisma from '@infrastructure/database/prisma';

describe('Tests de Integración — HU-047: Dashboard de Indicadores Clave del Negocio (KPIs) (T-201)', () => {
  const dummyAdminUser = {
    id: 1,
    email: 'admin@e-commerce.com',
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

  describe('GET /api/v1/admin/dashboard/kpis', () => {
    it('debe retornar HTTP 200 y los KPIs acumulados con la estructura correcta', async () => {
      // Mock de POS order aggregate
      (prisma.posOrder.aggregate as any).mockResolvedValue({
        _sum: { total: 1000.5 },
      });

      // Mock de ecommerce order aggregate
      (prisma.order.aggregate as any).mockResolvedValue({
        _sum: { total: 500.25 },
      });

      // Mock de ecommerce order count (pedidos pendientes)
      (prisma.order.count as any).mockResolvedValue(3);

      // Mock de stockAlert.findMany
      (prisma.stockAlert.findMany as any).mockResolvedValue([
        {
          id: 1,
          variantId: 10,
          branchId: 1,
          isActive: true,
          variant: {
            sku: 'CAM-M-ROJO',
            minStock: 5,
            product: { name: 'Camisa Casual' },
            branchStock: [{ branchId: 1, quantity: 2, status: 'AVAILABLE' }],
          },
          branch: { name: 'Sede Miraflores' },
        },
      ]);

      // Mock de posOrder.groupBy
      (prisma.posOrder.groupBy as any).mockResolvedValue([
        {
          branchId: 1,
          _sum: { total: 1000.5 },
        },
      ]);

      // Mock de branch.findMany (sucursales activas para cruce)
      (prisma.branch.findMany as any).mockResolvedValue([
        {
          id: 1,
          name: 'Sede Miraflores',
          isActive: true,
        },
        {
          id: 2,
          name: 'Sede San Isidro',
          isActive: true,
        },
      ]);

      const response = await request(app)
        .get('/api/v1/admin/dashboard/kpis')
        .set('Authorization', 'Bearer dummy-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('todaySales');
      expect(response.body.data.todaySales).toEqual({
        total: 1500.75,
        pos: 1000.5,
        ecommerce: 500.25,
      });
      expect(response.body.data).toHaveProperty('pendingOrdersCount', 3);
      expect(response.body.data).toHaveProperty('criticalStock');
      expect(response.body.data.criticalStock.count).toBe(1);
      expect(response.body.data.criticalStock.products[0]).toEqual({
        sku: 'CAM-M-ROJO',
        productName: 'Camisa Casual',
        branchName: 'Sede Miraflores',
        currentStock: 2,
        minStock: 5,
      });
      expect(response.body.data.salesByBranch).toEqual([
        {
          branchId: 1,
          branchName: 'Sede Miraflores',
          totalSales: 1000.5,
        },
        {
          branchId: 2,
          branchName: 'Sede San Isidro',
          totalSales: 0,
        },
      ]);
    });

    it('debe retornar HTTP 403 si el usuario no tiene el permiso sales:read', async () => {
      const dummyClientUser = {
        id: 1,
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
        .get('/api/v1/admin/dashboard/kpis')
        .set('Authorization', 'Bearer dummy-token');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain(
        "Acceso denegado: Se requiere el permiso 'sales:read'"
      );
    });
  });
});
