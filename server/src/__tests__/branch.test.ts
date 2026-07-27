import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../app';

// 1. Mock Prisma client to avoid actual database reads/writes
jest.mock('@infrastructure/database/prisma', () => {
  const mockBranch = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const mockWarehouse = {
    create: jest.fn(),
  };
  const mockUser = {
    findUnique: jest.fn(),
  };

  const mockPrisma: any = {
    branch: mockBranch,
    warehouse: mockWarehouse,
    user: mockUser,
    $transaction: jest.fn().mockImplementation(async (cb: any): Promise<any> => cb(mockPrisma)),
  };

  return {
    __esModule: true,
    default: mockPrisma,
  };
});

import prisma from '@infrastructure/database/prisma';

// 2. Mock JwtService to bypass raw token generation and signing
jest.mock('@infrastructure/services/JwtService', () => {
  return {
    JwtService: jest.fn().mockImplementation(() => ({
      verifyAccessToken: jest.fn().mockReturnValue({
        userId: 1,
        email: 'admin@dmendoza.com',
        role: 'SUPERADMIN',
      }),
    })),
  };
});

// Mocked Security Principal User
const mockAdminUser = {
  id: 1,
  email: 'admin@dmendoza.com',
  isActive: true,
  roles: [
    {
      name: 'SUPERADMIN',
      permissions: [
        { name: 'users:read' },
        { name: 'users:write' },
      ],
    },
  ],
};

const dummyBranchRecord = {
  id: 10,
  name: 'Sucursal Central',
  address: 'Av. Larco 123',
  phone: '999888777',
  isActive: true,
  isMain: false,
  warehouse: {
    id: 100,
    branchId: 10,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('Módulo Branch — HU-020 (T-063 y T-064)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.branch.findUnique as any).mockReset();
    (prisma.branch.findMany as any).mockReset();
    (prisma.branch.create as any).mockReset();
    (prisma.branch.update as any).mockReset();
    (prisma.warehouse.create as any).mockReset();
    (prisma.user.findUnique as any).mockReset();
    // Default mock behavior for RBAC middleware authorization
    (prisma.user.findUnique as any).mockResolvedValue(mockAdminUser);
  });

  describe('Use Cases (Capa de Aplicación)', () => {
    const { CreateBranchUseCase } = require('@application/use-cases/branch/CreateBranchUseCase');
    const { UpdateBranchUseCase } = require('@application/use-cases/branch/UpdateBranchUseCase');
    const { ToggleBranchStatusUseCase } = require('@application/use-cases/branch/ToggleBranchStatusUseCase');
    const { PrismaBranchRepository } = require('@infrastructure/database/repositories/PrismaBranchRepository');

    let branchRepo: any;
    let createBranchUC: any;
    let updateBranchUC: any;
    let toggleBranchStatusUC: any;

    beforeEach(() => {
      branchRepo = new PrismaBranchRepository();
      createBranchUC = new CreateBranchUseCase(branchRepo);
      updateBranchUC = new UpdateBranchUseCase(branchRepo);
      toggleBranchStatusUC = new ToggleBranchStatusUseCase(branchRepo);
    });

    it('CreateBranchUseCase: debe crear una sucursal y su almacén asociado', async () => {
      (prisma.branch.findUnique as any).mockResolvedValue(null); // Name is free
      (prisma.branch.create as any).mockResolvedValue(dummyBranchRecord);
      (prisma.warehouse.create as any).mockResolvedValue(dummyBranchRecord.warehouse);

      const result = await createBranchUC.execute({
        name: 'Sucursal Central',
        address: 'Av. Larco 123',
        phone: '999888777',
      });

      expect(result.id).toBe(10);
      expect(result.name).toBe('Sucursal Central');
      expect(result.warehouse).toEqual({
        id: 100,
        createdAt: dummyBranchRecord.warehouse.createdAt,
      });
    });

    it('CreateBranchUseCase: debe lanzar un error si el nombre de sucursal ya existe', async () => {
      (prisma.branch.findUnique as any).mockResolvedValue(dummyBranchRecord);

      await expect(
        createBranchUC.execute({ name: 'Sucursal Central' })
      ).rejects.toThrow('El nombre de la sucursal ya está registrado');
    });

    it('UpdateBranchUseCase: debe actualizar los detalles de la sucursal', async () => {
      (prisma.branch.findUnique as any)
        .mockResolvedValueOnce(dummyBranchRecord) // findById check
        .mockResolvedValueOnce(null); // findByName check (no conflicts)
      
      (prisma.branch.update as any).mockResolvedValue({
        ...dummyBranchRecord,
        address: 'Nueva Dirección 456',
      });

      const result = await updateBranchUC.execute(10, {
        address: 'Nueva Dirección 456',
      });

      expect(result.id).toBe(10);
      expect(result.address).toBe('Nueva Dirección 456');
    });

    it('ToggleBranchStatusUseCase: debe cambiar el estado isActive correctamente', async () => {
      (prisma.branch.findUnique as any).mockResolvedValue(dummyBranchRecord);
      (prisma.branch.update as any).mockResolvedValue({
        ...dummyBranchRecord,
        isActive: false,
      });

      const result = await toggleBranchStatusUC.execute(10, false);

      expect(result.id).toBe(10);
      expect(result.isActive).toBe(false);
    });
  });

  describe('HTTP REST Endpoints (Capa de Infraestructura)', () => {
    it('POST /api/v1/branches — debe crear una sucursal exitosamente', async () => {
      (prisma.branch.findUnique as any).mockResolvedValue(null);
      (prisma.branch.create as any).mockResolvedValue(dummyBranchRecord);
      (prisma.warehouse.create as any).mockResolvedValue(dummyBranchRecord.warehouse);

      const res = await request(app)
        .post('/api/v1/branches')
        .set('Authorization', 'Bearer mock-token')
        .send({
          name: 'Sucursal Central',
          address: 'Av. Larco 123',
          phone: '999888777',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(10);
      expect(res.body.data.name).toBe('Sucursal Central');
      expect(res.body.data.warehouse).toBeDefined();
    });

    it('POST /api/v1/branches — debe fallar con 400 si el nombre es demasiado corto', async () => {
      const res = await request(app)
        .post('/api/v1/branches')
        .set('Authorization', 'Bearer mock-token')
        .send({
          name: 'S', // 1 char (Zod requires min 2)
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toContain('al menos 2 caracteres');
    });

    it('PUT /api/v1/branches/:id — debe actualizar exitosamente la sucursal', async () => {
      (prisma.branch.findUnique as any)
        .mockResolvedValueOnce(dummyBranchRecord) // findById
        .mockResolvedValueOnce(null); // findByName (no conflict)
      (prisma.branch.update as any).mockResolvedValue({
        ...dummyBranchRecord,
        name: 'Sucursal Norte',
      });

      const res = await request(app)
        .put('/api/v1/branches/10')
        .set('Authorization', 'Bearer mock-token')
        .send({
          name: 'Sucursal Norte',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Sucursal Norte');
    });

    it('PATCH /api/v1/branches/:id/status — debe alternar el estado de la sucursal', async () => {
      (prisma.branch.findUnique as any).mockResolvedValue(dummyBranchRecord);
      (prisma.branch.update as any).mockResolvedValue({
        ...dummyBranchRecord,
        isActive: false,
      });

      const res = await request(app)
        .patch('/api/v1/branches/10/status')
        .set('Authorization', 'Bearer mock-token')
        .send({
          isActive: false,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('inactivada');
      expect(res.body.data.isActive).toBe(false);
    });

    it('GET /api/v1/branches — debe listar todas las sucursales', async () => {
      (prisma.branch.findMany as any).mockResolvedValue([dummyBranchRecord]);

      const res = await request(app)
        .get('/api/v1/branches')
        .set('Authorization', 'Bearer mock-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data[0].id).toBe(10);
    });
  });
});


