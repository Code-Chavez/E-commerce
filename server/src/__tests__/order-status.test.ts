import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../app';
import { Readable } from 'stream';

// 1. Mock ResendEmailService
var mockSendEmail = jest.fn<any>().mockResolvedValue(undefined);
jest.mock('@infrastructure/services/ResendEmailService', () => {
  return {
    ResendEmailService: jest.fn().mockImplementation(() => {
      return {
        sendEmail: (to: string, subject: string, html: string) => mockSendEmail(to, subject, html),
      };
    }),
  };
});

// 1.5 Mock FactilizaWhatsAppService
var mockSendMessage = jest.fn<any>().mockResolvedValue(true);
jest.mock('@infrastructure/services/FactilizaWhatsAppService', () => {
  return {
    FactilizaWhatsAppService: jest.fn().mockImplementation(() => {
      return {
        sendMessage: (phone: string, template: string, params: Record<string, string>) => mockSendMessage(phone, template, params),
      };
    }),
  };
});

// 2. Mock Prisma Client
jest.mock('@infrastructure/database/prisma', () => {
  const mockOrder = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  };
  const mockUser = {
    findUnique: jest.fn(),
  };
  const mockOrderStatusLog = {
    create: jest.fn(),
  };
  const mockDelivery = {
    create: jest.fn(),
  };

  const mockPrisma: any = {
    order: mockOrder,
    user: mockUser,
    orderStatusLog: mockOrderStatusLog,
    delivery: mockDelivery,
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

// 3. Mock JwtService for requirePermission
let mockUserJwtRole = 'ADMIN';
jest.mock('@infrastructure/services/JwtService', () => ({
  JwtService: jest.fn().mockImplementation(() => ({
    verifyAccessToken: jest.fn().mockImplementation(() => ({
      userId: 1,
      email: 'admin@example.com',
      role: mockUserJwtRole,
    })),
  })),
}));

import prisma from '@infrastructure/database/prisma';

describe('Tests de Integración — HU-045: Seguimiento del Estado del Pedido y Notificaciones por Correo (T-198 / T-199)', () => {
  const dummyAdmin = {
    id: 1,
    email: 'admin@example.com',
    isActive: true,
    roles: [
      {
        id: 1,
        name: 'ADMIN',
        permissions: [
          { id: 1, name: 'roles:manage' },
        ],
      },
    ],
  };

  const dummySeller = {
    id: 3,
    email: 'seller@example.com',
    isActive: true,
    roles: [
      {
        id: 2,
        name: 'SELLER',
        permissions: [],
      },
    ],
  };

  const dummyCustomer = {
    id: 2,
    email: 'customer@example.com',
    name: 'Juan',
    lastName: 'Pérez',
    phone: '+51999888777',
    isActive: true,
  };

  const dummyOrder = {
    id: 10,
    userId: 2,
    status: 'PAID',
    total: 115.00,
    shippingCost: 15.00,
    addressSnapshot: { alias: 'Casa', fullAddress: 'Av Larco 123', district: 'Miraflores' },
    paymentIntentId: 'pi_test_123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserJwtRole = 'ADMIN';
    mockSendEmail.mockClear();
    mockSendMessage.mockClear();

    // Setup Prisma mocks for default successful path
    // Mock findUnique user implementation to handle authorization and customer fetch
    (prisma.user.findUnique as any).mockImplementation(async (args: any) => {
      const id = args.where?.id;
      const email = args.where?.email;
      if (id === 1 || email === 'admin@example.com') return dummyAdmin;
      if (id === 2 || email === 'customer@example.com') return dummyCustomer;
      if (id === 3 || email === 'seller@example.com') return dummySeller;
      return null;
    });

    (prisma.order.findUnique as any).mockResolvedValue(dummyOrder);
    (prisma.order.update as any).mockImplementation(async (args: any) => {
      // Simulate Prisma Client Extension
      if (args.data.status) {
        await prisma.orderStatusLog.create({
          data: {
            orderId: args.where.id,
            status: args.data.status,
            changedBy: 'admin@example.com',
          },
        });
      }
      return { ...dummyOrder, status: args.data.status };
    });
  });

  describe('PATCH /api/v1/admin/orders/:id/status', () => {
    it('debe actualizar el estado a SHIPPED exitosamente (y enviar correo y WhatsApp)', async () => {
      const res = await request(app)
        .patch('/api/v1/admin/orders/10/status')
        .set('Authorization', 'Bearer dummy-admin-token')
        .send({ status: 'SHIPPED' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { status: 'SHIPPED' },
        include: {
          items: { include: { variant: { include: { product: true } } } },
          statusLogs: true,
        },
      });

      // Verification for WhatsApp
      expect(mockSendMessage).toHaveBeenCalledWith(
        '+51999888777',
        'ORDER_STATUS_SHIPPED',
        { orderId: '10', status: 'En Camino (Enviado)' }
      );
    });

    it('debe actualizar el estado a PAID exitosamente y enviar notificaciones', async () => {
      const res = await request(app)
        .patch('/api/v1/admin/orders/10/status')
        .set('Authorization', 'Bearer dummy-admin-token')
        .send({ status: 'PAID' });

      expect(res.status).toBe(200);
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { status: 'PAID' },
        include: {
          items: { include: { variant: { include: { product: true } } } },
          statusLogs: true,
        },
      });
      // Verification for email
      expect(mockSendEmail).toHaveBeenCalledWith(
        'customer@example.com',
        "Actualización de tu Pedido #10 — E-Commerce",
        expect.stringContaining('Pagado')
      );
      // Verification for WhatsApp
      expect(mockSendMessage).toHaveBeenCalledWith(
        '+51999888777',
        'ORDER_STATUS_PAID',
        { orderId: '10', status: 'Pagado' }
      );
    });

    it('debería retornar 403 si el usuario es SELLER y no tiene permisos de administrador', async () => {
      mockUserJwtRole = 'SELLER';
      (prisma.user.findUnique as any).mockImplementation(async (args: any) => {
        return dummySeller;
      });

      const res = await request(app)
        .patch('/api/v1/admin/orders/10/status')
        .set('Authorization', 'Bearer mock-token')
        .send({ status: 'SHIPPED' })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Acceso denegado');
      expect(prisma.order.update).not.toHaveBeenCalled();
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it('debe actualizar el estado a PAID exitosamente y autogenerar picking list', async () => {
      // Mock findMany to return the paid order so picking list is generated
      (prisma.order.findMany as any).mockResolvedValue([{
        id: 10,
        status: 'PAID',
        items: [{ variantId: 5, qty: 2 }],
        user: { id: 1, name: 'John', email: 'john@example.com' },
        addressSnapshot: {}
      }]);
      (prisma.delivery.create as any).mockResolvedValue({ id: 100, status: 'PENDING' });

      const res = await request(app)
        .patch('/api/v1/admin/orders/10/status')
        .set('Authorization', 'Bearer dummy-admin-token')
        .send({ status: 'PAID' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      
      // Verify picking list generation was triggered
      expect(prisma.order.findMany).toHaveBeenCalled();
      expect(prisma.delivery.create).toHaveBeenCalled();
    });

    it('debería retornar 400 si el estado enviado no es válido', async () => {
      const res = await request(app)
        .patch('/api/v1/admin/orders/10/status')
        .set('Authorization', 'Bearer mock-token')
        .send({ status: 'INVALID_STATUS' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Estado de pedido inválido');
      expect(prisma.order.update).not.toHaveBeenCalled();
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it('debería retornar 400 si el estado no se proporciona en el body', async () => {
      const res = await request(app)
        .patch('/api/v1/admin/orders/10/status')
        .set('Authorization', 'Bearer mock-token')
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('El estado del pedido es requerido');
    });

    it('debería retornar 404 si el pedido especificado no existe', async () => {
      (prisma.order.findUnique as any).mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/v1/admin/orders/999/status')
        .set('Authorization', 'Bearer mock-token')
        .send({ status: 'DELIVERED' })
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Pedido no encontrado');
    });
  });
});


