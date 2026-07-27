import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../app';

// 1. Mock Prisma client
jest.mock('@infrastructure/database/prisma', () => {
  const mockClient = {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  };
  const mockUser = {
    findUnique: jest.fn(),
  };

  const mockPrisma: any = {
    client: mockClient,
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

describe('Tests de Integración — HU-052: Gestión Unificada de la Base de Clientes (T-205)', () => {
  const dummyAdminUser = {
    id: 1,
    email: 'admin@e-commerce.com',
    isActive: true,
    roles: [
      {
        name: 'ADMIN',
        permissions: [{ name: 'users:read' }, { name: 'users:write' }],
      },
    ],
  };

  const dummyClientsList = [
    {
      id: 101,
      email: 'pos_only@example.com',
      name: 'Juan POS',
      lastName: 'Pérez',
      phone: '999888777',
      documentType: 'DNI',
      documentId: '10000001',
      userId: null,
      user: null,
      createdAt: new Date('2026-06-20T10:00:00Z'),
      updatedAt: new Date('2026-06-20T10:00:00Z'),
    },
    {
      id: 102,
      email: 'ecommerce_only@example.com',
      name: 'María Web',
      lastName: 'Gómez',
      phone: '999888776',
      documentType: 'DNI',
      documentId: '10000002',
      userId: 2,
      user: {
        isActive: true,
        _count: { orders: 0 },
      },
      createdAt: new Date('2026-06-21T10:00:00Z'),
      updatedAt: new Date('2026-06-21T10:00:00Z'),
    },
    {
      id: 103,
      email: 'both@example.com',
      name: 'Carlos Ambos',
      lastName: 'López',
      phone: '999888775',
      documentType: 'DNI',
      documentId: '10000003',
      userId: 3,
      user: {
        isActive: true,
        _count: { orders: 5 },
      },
      createdAt: new Date('2026-06-22T10:00:00Z'),
      updatedAt: new Date('2026-06-22T10:00:00Z'),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.user.findUnique as any).mockResolvedValue(dummyAdminUser);
  });

  describe('GET /api/v1/admin/clients', () => {
    it('debería listar todos los clientes y clasificarlos dinámicamente como POS, ECOMMERCE y AMBOS', async () => {
      (prisma.client.findMany as any).mockResolvedValue(dummyClientsList);
      (prisma.client.count as any).mockResolvedValue(3);

      const response = await request(app)
        .get('/api/v1/admin/clients?type=ALL&page=1&limit=10')
        .set('Authorization', 'Bearer dummy-admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('clients');
      expect(response.body.clients.length).toBe(3);

      // Verify dynamic classification:
      // Client 1 (Juan POS) has userId null -> type POS, isActive true (default)
      expect(response.body.clients[0]).toMatchObject({
        id: 101,
        name: 'Juan POS',
        type: 'POS',
        isActive: true,
      });

      // Client 2 (María Web) has userId !== null, active, 0 orders -> type ECOMMERCE
      expect(response.body.clients[1]).toMatchObject({
        id: 102,
        name: 'María Web',
        type: 'ECOMMERCE',
        isActive: true,
      });

      // Client 3 (Carlos Ambos) has userId !== null, active, 5 orders -> type AMBOS
      expect(response.body.clients[2]).toMatchObject({
        id: 103,
        name: 'Carlos Ambos',
        type: 'AMBOS',
        isActive: true,
      });

      expect(response.body.pagination).toEqual({
        total: 3,
        page: 1,
        totalPages: 1,
        limit: 10,
      });
    });

    it('debería pasar los filtros correctos a Prisma cuando se filtra por type=POS', async () => {
      (prisma.client.findMany as any).mockResolvedValue([dummyClientsList[0]]);
      (prisma.client.count as any).mockResolvedValue(1);

      const response = await request(app)
        .get('/api/v1/admin/clients?type=POS')
        .set('Authorization', 'Bearer dummy-admin-token');

      expect(response.status).toBe(200);
      expect(prisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              {
                OR: [{ userId: null }, { user: { isActive: false } }],
              },
            ],
          },
        })
      );
    });

    it('debería pasar los filtros correctos a Prisma cuando se filtra por type=ECOMMERCE y se busca por texto', async () => {
      (prisma.client.findMany as any).mockResolvedValue([dummyClientsList[1]]);
      (prisma.client.count as any).mockResolvedValue(1);

      const response = await request(app)
        .get('/api/v1/admin/clients?type=ECOMMERCE&search=María')
        .set('Authorization', 'Bearer dummy-admin-token');

      expect(response.status).toBe(200);
      expect(prisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              {
                OR: [
                  { name: { contains: 'María' } },
                  { lastName: { contains: 'María' } },
                  { documentId: { contains: 'María' } },
                ],
              },
              { userId: { not: null } },
              { user: { isActive: true } },
            ],
          },
        })
      );
    });

    it('debería denegar acceso con HTTP 403 si el usuario carece del permiso users:read', async () => {
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
        .get('/api/v1/admin/clients')
        .set('Authorization', 'Bearer dummy-client-token');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain(
        "Acceso denegado: Se requiere el permiso 'users:read'"
      );
    });

    it('debería retornar HTTP 400 si se envía un valor inválido en el parámetro type', async () => {
      const response = await request(app)
        .get('/api/v1/admin/clients?type=INVALID')
        .set('Authorization', 'Bearer dummy-admin-token');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error[0].field).toBe('type');
    });
  });

  describe('PUT /api/v1/admin/clients/:id', () => {
    const dummyClient = {
      id: 101,
      email: 'juan@example.com',
      name: 'Juan',
      lastName: 'Pérez',
      phone: '999888777',
      documentType: 'DNI',
      documentId: '10000001',
      userId: null,
      createdAt: new Date('2026-06-20T10:00:00Z'),
      updatedAt: new Date('2026-06-20T10:00:00Z'),
    };

    it('debería actualizar los datos del cliente correctamente', async () => {
      (prisma.client.findUnique as any)
        .mockResolvedValueOnce(dummyClient) // findById
        .mockResolvedValueOnce(null); // findByEmail conflict check

      const updatedClient = {
        ...dummyClient,
        name: 'Juan Carlos',
        email: 'juancarlos@example.com',
      };
      (prisma.client.update as any).mockResolvedValue(updatedClient);

      const response = await request(app)
        .put('/api/v1/admin/clients/101')
        .set('Authorization', 'Bearer dummy-admin-token')
        .send({
          email: 'juancarlos@example.com',
          name: 'Juan Carlos',
          lastName: 'Pérez',
          phone: '999888777',
          documentType: 'DNI',
          documentId: '10000001',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Juan Carlos');
      expect(response.body.data.email).toBe('juancarlos@example.com');
    });

    it('debería retornar HTTP 404 si el cliente no existe', async () => {
      (prisma.client.findUnique as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/v1/admin/clients/999')
        .set('Authorization', 'Bearer dummy-admin-token')
        .send({
          name: 'Inexistente',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Cliente no encontrado');
    });

    it('debería retornar HTTP 400 si el email ya está registrado por otro cliente', async () => {
      (prisma.client.findUnique as any)
        .mockResolvedValueOnce(dummyClient) // findById
        .mockResolvedValueOnce({ id: 102, email: 'conflict@example.com' }); // findByEmail conflict client

      const response = await request(app)
        .put('/api/v1/admin/clients/101')
        .set('Authorization', 'Bearer dummy-admin-token')
        .send({
          name: 'Juan',
          email: 'conflict@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error[0].field).toBe('email');
      expect(response.body.error[0].message).toContain(
        'ya está registrado por otro cliente'
      );
    });

    it('debería denegar acceso con HTTP 403 si el usuario carece del permiso users:write', async () => {
      const dummyClientUser = {
        id: 2,
        email: 'client@example.com',
        isActive: true,
        roles: [
          {
            name: 'CLIENT',
            permissions: [{ name: 'users:read' }],
          },
        ],
      };
      (prisma.user.findUnique as any).mockResolvedValue(dummyClientUser);

      const response = await request(app)
        .put('/api/v1/admin/clients/101')
        .set('Authorization', 'Bearer dummy-client-token')
        .send({
          name: 'Juan',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain(
        "Acceso denegado: Se requiere el permiso 'users:write'"
      );
    });

    it('debería retornar HTTP 400 si se envía un body inválido', async () => {
      const response = await request(app)
        .put('/api/v1/admin/clients/101')
        .set('Authorization', 'Bearer dummy-admin-token')
        .send({
          name: '',
          email: 'not-an-email',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.some((err: any) => err.field === 'name')).toBe(
        true
      );
      expect(
        response.body.error.some((err: any) => err.field === 'email')
      ).toBe(true);
    });
  });
});
