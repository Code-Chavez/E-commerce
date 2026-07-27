import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../app';

// 1. Mock Prisma client
jest.mock('@infrastructure/database/prisma', () => {
  const mockOperatingExpense = {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const mockUser = {
    findUnique: jest.fn(),
  };

  const mockPrisma: any = {
    operatingExpense: mockOperatingExpense,
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

describe('Tests de Integración — HU-071: Registro de Gastos Operativos por Sucursal (T-244)', () => {
  const dummyAdminUser = {
    id: 1,
    email: 'admin@e-commerce.com',
    isActive: true,
    roles: [
      {
        name: 'ADMIN',
        permissions: [
          { name: 'sales:read' },
          { name: 'sales:write' },
          { name: 'roles:manage' },
          { name: 'expenses:write' },
          { name: 'expenses:read' },
        ],
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.user.findUnique as any).mockResolvedValue(dummyAdminUser);
  });

  describe('POST /api/v1/admin/expenses', () => {
    it('debe registrar un gasto operativo exitosamente', async () => {
      const payload = {
        branchId: 1,
        type: 'FIXED',
        description: 'Alquiler de local',
        amount: 1500.0,
        date: '2026-07-02T10:00:00.000Z',
      };

      (prisma.operatingExpense.create as any).mockResolvedValue({
        id: 10,
        branchId: 1,
        type: 'FIXED',
        description: 'Alquiler de local',
        amount: 1500.0,
        date: new Date(payload.date),
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app)
        .post('/api/v1/admin/expenses')
        .set('Authorization', 'Bearer dummy-token')
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', 10);
      expect(response.body.data.amount).toBe(1500.0);
      expect(response.body.data.userId).toBe(1);
    });

    it('debe retornar HTTP 400 si el monto es negativo', async () => {
      const payload = {
        branchId: 1,
        type: 'FIXED',
        description: 'Servicio de luz',
        amount: -50.0,
        date: '2026-07-02T10:00:00.000Z',
      };

      const response = await request(app)
        .post('/api/v1/admin/expenses')
        .set('Authorization', 'Bearer dummy-token')
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });

    it('debe retornar HTTP 400 si el tipo es inválido', async () => {
      const payload = {
        branchId: 1,
        type: 'INVALID_TYPE',
        description: 'Servicio de luz',
        amount: 50.0,
        date: '2026-07-02T10:00:00.000Z',
      };

      const response = await request(app)
        .post('/api/v1/admin/expenses')
        .set('Authorization', 'Bearer dummy-token')
        .send(payload);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/admin/expenses', () => {
    it('debe retornar la lista de gastos operativos', async () => {
      const mockExpenses = [
        {
          id: 1,
          branchId: 1,
          type: 'FIXED',
          description: 'Local 1 Rent',
          amount: 1000,
          date: new Date(),
          userId: 1,
        },
      ];
      (prisma.operatingExpense.findMany as any).mockResolvedValue(mockExpenses);

      const response = await request(app)
        .get('/api/v1/admin/expenses')
        .set('Authorization', 'Bearer dummy-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].description).toBe('Local 1 Rent');
    });
  });

  describe('PUT /api/v1/admin/expenses/:id', () => {
    it('debe actualizar un gasto operativo exitosamente', async () => {
      (prisma.operatingExpense.findUnique as any).mockResolvedValue({
        id: 1,
        branchId: 1,
        type: 'FIXED',
        description: 'Local Rent',
        amount: 1000,
        date: new Date(),
        userId: 1,
      });

      (prisma.operatingExpense.update as any).mockResolvedValue({
        id: 1,
        branchId: 1,
        type: 'VARIABLE',
        description: 'Updated Rent',
        amount: 1100,
        date: new Date(),
        userId: 1,
      });

      const response = await request(app)
        .put('/api/v1/admin/expenses/1')
        .set('Authorization', 'Bearer dummy-token')
        .send({
          type: 'VARIABLE',
          description: 'Updated Rent',
          amount: 1100,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.amount).toBe(1100);
      expect(response.body.data.description).toBe('Updated Rent');
    });

    it('debe retornar HTTP 404 si el gasto no existe', async () => {
      (prisma.operatingExpense.findUnique as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/v1/admin/expenses/999')
        .set('Authorization', 'Bearer dummy-token')
        .send({
          amount: 200,
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/admin/expenses/:id', () => {
    it('debe eliminar un gasto operativo', async () => {
      (prisma.operatingExpense.findUnique as any).mockResolvedValue({
        id: 1,
        branchId: 1,
        type: 'FIXED',
        description: 'Rent',
        amount: 1000,
        date: new Date(),
        userId: 1,
      });

      (prisma.operatingExpense.delete as any).mockResolvedValue({});

      const response = await request(app)
        .delete('/api/v1/admin/expenses/1')
        .set('Authorization', 'Bearer dummy-token');

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('eliminado exitosamente');
    });

    it('debe retornar HTTP 404 si el gasto no existe', async () => {
      (prisma.operatingExpense.findUnique as any).mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/v1/admin/expenses/999')
        .set('Authorization', 'Bearer dummy-token');

      expect(response.status).toBe(404);
    });
  });
});
