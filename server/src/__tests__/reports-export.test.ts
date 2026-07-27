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
  const mockClient = {
    findMany: jest.fn(),
  };
  const mockProductVariant = {
    findMany: jest.fn(),
  };
  const mockUser = {
    findUnique: jest.fn(),
  };

  const mockPrisma: any = {
    order: mockOrder,
    posOrder: mockPosOrder,
    client: mockClient,
    productVariant: mockProductVariant,
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
      email: 'admin@e-commerce.com',
      role: 'ADMIN',
    }),
  })),
}));

import prisma from '@infrastructure/database/prisma';

describe('Tests de Integración — HU-053: Exportación de Reportes (T-207)', () => {
  const dummyAdminUser = {
    id: 1,
    email: 'admin@e-commerce.com',
    isActive: true,
    roles: [
      {
        name: 'ADMIN',
        permissions: [
          { name: 'sales:read' },
        ],
      },
    ],
  };

  const dummyOrders = [
    {
      id: 1,
      userId: 10,
      status: 'DELIVERED',
      total: 150.0,
      shippingCost: 15.0,
      addressSnapshot: {},
      paymentIntentId: 'pi_test_1',
      createdAt: new Date('2026-06-25T10:00:00Z'),
      updatedAt: new Date('2026-06-25T10:00:00Z'),
      user: { id: 10, name: 'Juan Ecom', email: 'juan@ecom.com' },
      items: [
        {
          id: 1,
          orderId: 1,
          variantId: 101,
          qty: 2,
          unitPrice: 67.5,
          variant: {
            sku: 'VAR-101',
            product: { name: 'Polo Premium' },
          },
        },
      ],
    },
  ];

  const dummyPosOrders = [
    {
      id: 2,
      status: 'COMPLETED',
      subtotal: 100.0,
      discountTotal: 10.0,
      total: 90.0,
      branchId: 1,
      createdAt: new Date('2026-06-25T12:00:00Z'),
      updatedAt: new Date('2026-06-25T12:00:00Z'),
      branch: { name: 'Sucursal Miraflores' },
      items: [
        {
          id: 2,
          qty: 1,
          unitPrice: 100.0,
          variant: {
            sku: 'VAR-102',
            product: { name: 'Pantalón Chino' },
          },
        },
      ],
    },
  ];

  const dummyClients = [
    {
      id: 50,
      email: 'pos_client@example.com',
      name: 'Carlos',
      lastName: 'POS',
      phone: '999888777',
      documentType: 'DNI',
      documentId: '87654321',
      address: 'Calle Falsa 123',
      district: 'San Isidro',
      createdAt: new Date('2026-06-20T08:00:00Z'),
      updatedAt: new Date('2026-06-20T08:00:00Z'),
      user: null,
    },
  ];

  const dummyStockAlerts = [
    {
      id: 101,
      sku: 'SKU-001',
      product: { name: 'Zapatillas Running' },
      branchStock: [
        {
          branchId: 1,
          quantity: 15,
          branch: { name: 'Sucursal Miraflores' },
        },
      ],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.user.findUnique as any).mockResolvedValue(dummyAdminUser);
  });

  describe('GET /api/v1/reports/export', () => {
    it('debería exportar reporte de ventas en Excel (.xlsx) correctamente', async () => {
      (prisma.order.findMany as any).mockResolvedValue(dummyOrders);
      (prisma.posOrder.findMany as any).mockResolvedValue(dummyPosOrders);

      const response = await request(app)
        .get('/api/v1/reports/export?type=sales&format=excel&from=2026-06-01&to=2026-06-30')
        .set('Authorization', 'Bearer dummy-admin-token');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('reporte-sales');
      expect(response.headers['content-disposition']).toContain('.xlsx');
      
      expect(prisma.order.findMany).toHaveBeenCalled();
      expect(prisma.posOrder.findMany).toHaveBeenCalled();
    });

    it('debería exportar reporte de inventario en PDF (.pdf) correctamente', async () => {
      (prisma.productVariant.findMany as any).mockResolvedValue(dummyStockAlerts);

      const response = await request(app)
        .get('/api/v1/reports/export?type=inventory&format=pdf')
        .set('Authorization', 'Bearer dummy-admin-token');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('.pdf');

      expect(prisma.productVariant.findMany).toHaveBeenCalled();
    });

    it('debería exportar reporte de clientes en CSV (.csv) correctamente', async () => {
      (prisma.client.findMany as any).mockResolvedValue(dummyClients);

      const response = await request(app)
        .get('/api/v1/reports/export?type=clients&format=csv')
        .set('Authorization', 'Bearer dummy-admin-token');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('text/csv');
      expect(response.headers['content-disposition']).toContain('.csv');

      expect(prisma.client.findMany).toHaveBeenCalled();
    });

    it('debería retornar HTTP 400 si falta el parámetro type', async () => {
      const response = await request(app)
        .get('/api/v1/reports/export?format=excel')
        .set('Authorization', 'Bearer dummy-admin-token');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error[0].field).toBe('type');
    });

    it('debería retornar HTTP 400 si se envía un formato de fecha inválido', async () => {
      const response = await request(app)
        .get('/api/v1/reports/export?type=sales&format=pdf&from=2026/06/01')
        .set('Authorization', 'Bearer dummy-admin-token');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error[0].field).toBe('from');
    });

    it('debería denegar acceso con HTTP 403 si el usuario carece del permiso sales:read', async () => {
      const dummySellerUser = {
        id: 2,
        email: 'seller@e-commerce.com',
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
        .get('/api/v1/reports/export?type=sales&format=pdf')
        .set('Authorization', 'Bearer dummy-seller-token');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('sales:read');
    });
  });
});


