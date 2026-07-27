import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../app';
import prisma from '@infrastructure/database/prisma';

jest.mock('@infrastructure/database/prisma', () => {
  const mockRole = {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
  };
  const mockUser = {
    findUnique: jest.fn(),
    update: jest.fn(),
  };
  const mockPrisma: any = {
    role: mockRole,
    user: mockUser,
  };
  return { __esModule: true, default: mockPrisma };
});

jest.mock('@infrastructure/http/middlewares/auth.middleware', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.auth = { userId: 1, role: 'ADMIN' };
    next();
  },
  requirePermission: () => (req: any, res: any, next: any) => next(),
  optionalAuth: (req: any, res: any, next: any) => next(),
}));

describe('Role API (HU-049)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/roles', () => {
    it('should list all roles', async () => {
      const mockRoles = [
        { id: 1, name: 'ADMIN', description: 'Administrator' },
      ];
      (prisma.role.findMany as any).mockResolvedValue(mockRoles);

      const response = await request(app).get('/api/v1/roles');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockRoles);
    });
  });

  describe('POST /api/v1/roles', () => {
    it('should create a new role', async () => {
      const mockRole = { id: 2, name: 'VENDEDOR', description: 'Vendedor POS' };
      (prisma.role.findUnique as any).mockResolvedValue(null); // role doesn't exist
      (prisma.role.create as any).mockResolvedValue(mockRole);

      const response = await request(app)
        .post('/api/v1/roles')
        .send({ name: 'VENDEDOR', description: 'Vendedor POS' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockRole);
    });

    it('should fail if role already exists', async () => {
      (prisma.role.findUnique as any).mockResolvedValue({
        id: 1,
        name: 'ADMIN',
      });

      const response = await request(app)
        .post('/api/v1/roles')
        .send({ name: 'ADMIN' });

      expect(response.status).toBe(500); // Controller passes Error to next() which becomes 500
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/users/:id/role', () => {
    it('should assign a role to a user', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 2,
        email: 'user@example.com',
      });
      (prisma.role.findUnique as any).mockResolvedValue({
        id: 3,
        name: 'VENDEDOR',
      });
      (prisma.user.update as any).mockResolvedValue({});

      const response = await request(app)
        .put('/api/v1/users/2/role')
        .send({ roleName: 'VENDEDOR' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('asignado exitosamente');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { roles: { set: [{ id: 3 }] } },
      });
    });

    it('should fail if user ID is not a number', async () => {
      const response = await request(app)
        .put('/api/v1/users/abc/role')
        .send({ roleName: 'ADMIN' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail if user does not exist', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/v1/users/99/role')
        .send({ roleName: 'ADMIN' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should fail if role does not exist', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({ id: 2 });
      (prisma.role.findUnique as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/v1/users/2/role')
        .send({ roleName: 'GHOST' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
});
