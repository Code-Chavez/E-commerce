import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../app';

// 1. Mock Prisma client
jest.mock('@infrastructure/database/prisma', () => {
  const mockClientCredit = {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
  };
  const mockCreditPayment = {
    create: jest.fn(),
  };
  const mockClient = {
    findUnique: jest.fn(),
  };

  const mockPrisma: any = {
    clientCredit: mockClientCredit,
    creditPayment: mockCreditPayment,
    client: mockClient,
  };

  return { __esModule: true, default: mockPrisma };
});

import prisma from '@infrastructure/database/prisma';

describe('Tests de Integración — HU-072: Control de Cuentas por Cobrar y Créditos a Clientes (T-247)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/credits', () => {
    it('debe registrar un crédito de cliente exitosamente', async () => {
      const payload = {
        clientId: 1,
        totalAmount: 500.00,
        installments: 3,
        dueDate: '2026-08-01T00:00:00.000Z',
      };

      (prisma.client.findUnique as any).mockResolvedValue({ id: 1, name: 'Test Client' });
      (prisma.clientCredit.create as any).mockResolvedValue({
        id: 'credit-uuid-1',
        clientId: 1,
        totalAmount: 500.00,
        installments: 3,
        dueDate: new Date(payload.dueDate),
        createdAt: new Date(),
        updatedAt: new Date(),
        payments: [],
      });

      const response = await request(app)
        .post('/api/v1/credits')
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id', 'credit-uuid-1');
      expect(response.body.totalAmount).toBe(500.00);
      expect(response.body.installments).toBe(3);
    });

    it('debe retornar HTTP 400 si el cliente no existe', async () => {
      const payload = {
        clientId: 999,
        totalAmount: 500.00,
        installments: 3,
        dueDate: '2026-08-01T00:00:00.000Z',
      };

      (prisma.client.findUnique as any).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/credits')
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('no existe');
    });

    it('debe retornar HTTP 400 si el totalAmount es negativo o cero', async () => {
      const payload = {
        clientId: 1,
        totalAmount: -100.00,
        installments: 3,
        dueDate: '2026-08-01T00:00:00.000Z',
      };

      const response = await request(app)
        .post('/api/v1/credits')
        .send(payload);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/credits/:id/payments', () => {
    it('debe registrar un pago parcial exitosamente', async () => {
      const payload = { amount: 150.00 };
      const creditId = 'credit-uuid-1';

      (prisma.clientCredit.findUnique as any).mockResolvedValue({
        id: creditId,
        clientId: 1,
        totalAmount: 500.00,
        installments: 3,
        dueDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        payments: [],
      });

      (prisma.creditPayment.create as any).mockResolvedValue({
        id: 'payment-uuid-1',
        creditId,
        amount: 150.00,
        paidAt: new Date(),
      });

      const response = await request(app)
        .post(`/api/v1/credits/${creditId}/payments`)
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id', 'payment-uuid-1');
      expect(response.body.amount).toBe(150.00);
    });

    it('debe lanzar error si el pago supera el saldo pendiente', async () => {
      const payload = { amount: 600.00 };
      const creditId = 'credit-uuid-1';

      (prisma.clientCredit.findUnique as any).mockResolvedValue({
        id: creditId,
        clientId: 1,
        totalAmount: 500.00,
        installments: 3,
        dueDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        payments: [{ id: 'p-1', amount: 100.00 }], // pending is 400.00
      });

      const response = await request(app)
        .post(`/api/v1/credits/${creditId}/payments`)
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('supera el saldo pendiente');
    });

    it('debe retornar HTTP 400 si el crédito no existe', async () => {
      const payload = { amount: 100.00 };
      (prisma.clientCredit.findUnique as any).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/credits/non-existent-uuid/payments')
        .send(payload);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/credits?clientId=', () => {
    it('debe retornar el saldo pendiente agregado de los créditos activos', async () => {
      (prisma.client.findUnique as any).mockResolvedValue({ id: 1, name: 'Test Client' });
      (prisma.clientCredit.findMany as any).mockResolvedValue([
        {
          id: 'credit-1',
          clientId: 1,
          totalAmount: 500.00,
          installments: 3,
          dueDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          payments: [{ amount: 100.00 }],
        },
        {
          id: 'credit-2',
          clientId: 1,
          totalAmount: 200.00,
          installments: 2,
          dueDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          payments: [],
        }
      ]);

      const response = await request(app)
        .get('/api/v1/credits?clientId=1');

      expect(response.status).toBe(200);
      expect(response.body.clientId).toBe(1);
      expect(response.body.totalPendingBalance).toBe(600.00); // (500-100) + 200 = 600
      expect(response.body.credits).toHaveLength(2);
      expect(response.body.credits[0].pendingBalance).toBe(400.00);
      expect(response.body.credits[1].pendingBalance).toBe(200.00);
    });
  });
});


