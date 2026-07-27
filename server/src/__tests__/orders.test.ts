import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../app';
import { Readable } from 'stream';

// 1. Mock PDFKitReceiptPdfService
jest.mock('@infrastructure/services/PDFKitReceiptPdfService', () => {
  return {
    PDFKitReceiptPdfService: jest.fn().mockImplementation(() => {
      return {
        generateReceiptPdfStream: jest.fn().mockImplementation(async () => {
          const s = new Readable();
          s.push('mock pdf receipt stream content');
          s.push(null);
          return s;
        }),
      };
    }),
  };
});

// 2. Mock Prisma Client
jest.mock('@infrastructure/database/prisma', () => {
  const mockOrder = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
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

// 3. Mock JwtService for requireAuth
jest.mock('@infrastructure/services/JwtService', () => ({
  JwtService: jest.fn().mockImplementation(() => ({
    verifyAccessToken: jest.fn().mockReturnValue({
      userId: 1,
      email: 'client@example.com',
      role: 'CLIENT',
    }),
  })),
}));

import prisma from '@infrastructure/database/prisma';

describe('Tests de Integración — HU-044: Historial de Pedidos y Descarga de Comprobante Digital (T-195 / T-196)', () => {
  const dummyUser = { id: 1, email: 'client@example.com', isActive: true };
  const dummyOrder = {
    id: 10,
    userId: 1,
    status: 'PAID',
    total: 115.00,
    shippingCost: 15.00,
    addressSnapshot: { alias: 'Casa', fullAddress: 'Av Larco 123', district: 'Miraflores' },
    paymentIntentId: 'pi_test_123',
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      {
        id: 2,
        orderId: 10,
        variantId: 20,
        qty: 2,
        unitPrice: 50.00,
        variant: {
          sku: 'SKU-JEAN-M-BLUE',
          product: {
            name: 'Pantalón Jean Slim',
          },
        },
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.user.findUnique as any).mockResolvedValue(dummyUser);
  });

  describe('GET /api/v1/orders', () => {
    it('debe listar los pedidos del usuario autenticado con paginación y metadatos', async () => {
      (prisma.order.findMany as any).mockResolvedValue([dummyOrder]);
      (prisma.order.count as any).mockResolvedValue(1);

      const res = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', 'Bearer mock-token')
        .query({ page: 1, limit: 5 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.orders).toHaveLength(1);
      expect(res.body.data.orders[0].id).toBe(10);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.totalPages).toBe(1);
      expect(prisma.order.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { userId: 1 },
        skip: 0,
        take: 5,
      }));
    });

    it('debe filtrar por estado del pedido si se proporciona', async () => {
      (prisma.order.findMany as any).mockResolvedValue([]);
      (prisma.order.count as any).mockResolvedValue(0);

      await request(app)
        .get('/api/v1/orders')
        .set('Authorization', 'Bearer mock-token')
        .query({ status: 'DELIVERED' })
        .expect(200);

      expect(prisma.order.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { userId: 1, status: 'DELIVERED' },
      }));
    });

    it('debe retornar 400 si el parámetro status es inválido', async () => {
      const res = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', 'Bearer mock-token')
        .query({ status: 'INVALID_STATUS' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Estado de pedido inválido');
    });

    it('debe retornar 400 si page o limit son inválidos', async () => {
      const res = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', 'Bearer mock-token')
        .query({ page: -1 })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('El parámetro page debe ser un número entero positivo');
    });
  });

  describe('GET /api/v1/orders/:id/receipt/pdf', () => {
    it('debe retornar el stream del comprobante PDF si el pedido pertenece al usuario', async () => {
      (prisma.order.findUnique as any).mockResolvedValue(dummyOrder);

      const res = await request(app)
        .get('/api/v1/orders/10/receipt/pdf')
        .set('Authorization', 'Bearer mock-token')
        .buffer()
        .parse((res, callback) => {
          let data = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            callback(null, data as never);
          });
        })
        .expect(200);

      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment; filename=comprobante-pedido-10.pdf');
      expect(res.body).toBe('mock pdf receipt stream content');
    });

    it('debe retornar 403 si el pedido pertenece a otro usuario', async () => {
      (prisma.order.findUnique as any).mockResolvedValue({ ...dummyOrder, userId: 99 });

      const res = await request(app)
        .get('/api/v1/orders/10/receipt/pdf')
        .set('Authorization', 'Bearer mock-token')
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('No autorizado para ver este comprobante');
    });

    it('debe retornar 404 si el pedido no existe', async () => {
      (prisma.order.findUnique as any).mockResolvedValue(null);

      const res = await request(app)
        .get('/api/v1/orders/999/receipt/pdf')
        .set('Authorization', 'Bearer mock-token')
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Pedido no encontrado');
    });
  });
});


