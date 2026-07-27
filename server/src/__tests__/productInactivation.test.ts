import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../app';

// 1. Mock Prisma — evitar BD real en tests
jest.mock('@infrastructure/database/prisma', () => {
  const mockProduct = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const mockProductVariant = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    createMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const mockUser = {
    findUnique: jest.fn(),
  };

  const mockPrisma: any = {
    product: mockProduct,
    productVariant: mockProductVariant,
    user: mockUser,
    $transaction: jest
      .fn()
      .mockImplementation(async (cb: any): Promise<any> => cb(mockPrisma)),
  };

  return { __esModule: true, default: mockPrisma };
});

// 2. Mock JwtService — bypass autenticación real
jest.mock('@infrastructure/services/JwtService', () => ({
  JwtService: jest.fn().mockImplementation(() => ({
    verifyAccessToken: jest.fn().mockReturnValue({
      userId: 1,
      email: 'admin@e-commerce.com',
      role: 'SUPERADMIN',
    }),
  })),
}));

import prisma from '@infrastructure/database/prisma';

// Mocks de Usuario admin con permisos de productos
const dummyAdmin = {
  id: 1,
  email: 'admin@e-commerce.com',
  isActive: true,
  roles: [
    {
      name: 'SUPERADMIN',
      permissions: [{ name: 'products:write' }, { name: 'products:read' }],
    },
  ],
};

const dummyProductActive = {
  id: 1,
  code: 'CAM',
  name: 'Camisa Blanca Activa',
  description: 'Un producto activo de demostración',
  isActive: true,
  variants: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const dummyProductInactive = {
  id: 2,
  code: 'PAN',
  name: 'Pantalón Inactivo',
  description: 'Un producto inhabilitado',
  isActive: false,
  variants: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Tests de Integración — HU-015: Inactivación Lógica de Productos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.user.findUnique as any).mockResolvedValue(dummyAdmin);
  });

  describe('GET /api/v1/ecommerce/products (Público)', () => {
    it('debe retornar únicamente los productos activos', async () => {
      // Mockear findMany para retornar solo el activo
      (prisma.product.findMany as any).mockResolvedValue([dummyProductActive]);

      const res = await request(app)
        .get('/api/v1/ecommerce/products')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(1);
      expect(res.body.data[0].isActive).toBe(true);

      // Validar que se consultó con el filtro where isActive: true en Prisma
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        })
      );
    });
  });

  describe('PATCH /api/v1/products/:id/status (Admin)', () => {
    it('debe cambiar el estado lógico de un producto exitosamente', async () => {
      (prisma.product.findUnique as any).mockResolvedValue(dummyProductActive);
      (prisma.product.update as any).mockResolvedValue({
        ...dummyProductActive,
        isActive: false,
      });

      const res = await request(app)
        .patch('/api/v1/products/1/status')
        .set('Authorization', 'Bearer mock-token')
        .send({ isActive: false })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.isActive).toBe(false);

      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { isActive: false },
        })
      );
    });

    it('debe retornar 404 si el producto no existe', async () => {
      (prisma.product.findUnique as any).mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/v1/products/999/status')
        .set('Authorization', 'Bearer mock-token')
        .send({ isActive: false })
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('no existe');
    });

    it('debe retornar 400 si el parámetro isActive es inválido o no se envía', async () => {
      const res = await request(app)
        .patch('/api/v1/products/1/status')
        .set('Authorization', 'Bearer mock-token')
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });
  });
});
