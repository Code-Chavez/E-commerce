import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../app';

/**
 * Tests de integración — HU-014: Variantes SKU (T-080)
 *
 * Cobertura:
 * - Crear 2 tallas × 2 colores → 4 variantes con SKUs únicos
 * - PUT variante: editar precio y SKU
 * - Conflicto SKU duplicado → 409
 * - Validación Zod: campos inválidos → 400
 * - GET variantes por producto → 200
 * - Producto inexistente → 404
 * - Variante inexistente → 404
 */

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

  const mockAttribute = {
    findMany: jest.fn(),
  };

  const mockPriceHistory = {
    create: jest.fn().mockImplementation((args: any) => Promise.resolve({ id: 1, ...args.data })),
    findMany: jest.fn(),
  };

  const mockAuditLog = {
    create: jest.fn().mockImplementation((args: any) => Promise.resolve({ id: 1, ...args.data })),
    findMany: jest.fn(),
  };

  const mockPrisma: any = {
    product: mockProduct,
    productVariant: mockProductVariant,
    user: mockUser,
    attribute: mockAttribute,
    priceHistory: mockPriceHistory,
    auditLog: mockAuditLog,
    $transaction: jest.fn().mockImplementation(async (cb: any): Promise<any> => cb(mockPrisma)),
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

// Usuario admin con permisos de productos
const mockAdminUser = {
  id: 1,
  email: 'admin@e-commerce.com',
  isActive: true,
  roles: [
    {
      name: 'SUPERADMIN',
      permissions: [
        { name: 'products:read' },
        { name: 'products:write' },
      ],
    },
  ],
};

// Fixture: producto base
const dummyProduct = {
  id: 1,
  code: 'CAM',
  name: 'Camiseta Básica',
  description: 'Camiseta de algodón pima',
  categoryId: null,
  isActive: true,
  variants: [],
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

// Fixture: variante base
const makeVariant = (id: number, sku: string, talla: string, color: string) => ({
  id,
  productId: 1,
  sku,
  price: '99.90', // Prisma retorna Decimal como string
  attributesJson: { talla, color },
  isActive: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
});

describe('Módulo ProductVariant — HU-014 (T-077, T-078, T-080)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.user.findUnique as any).mockResolvedValue(mockAdminUser);
    (prisma.attribute.findMany as any).mockResolvedValue([
      {
        id: 1,
        name: 'talla',
        isActive: true,
        values: [
          { id: 10, value: 'S', isActive: true },
          { id: 11, value: 'M', isActive: true },
        ],
      },
      {
        id: 2,
        name: 'color',
        isActive: true,
        values: [
          { id: 20, value: 'NEGRO', isActive: true },
          { id: 21, value: 'BLANCO', isActive: true },
        ],
      },
    ]);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // T-080: POST /api/v1/products/:id/variants — 2 tallas × 2 colores = 4 variantes
  // ─────────────────────────────────────────────────────────────────────────
  describe('POST /api/v1/products/:id/variants', () => {
    it('T-080 ✅ debe crear 4 variantes únicas para 2 tallas × 2 colores', async () => {
      // Sin variantes existentes
      (prisma.product.findUnique as any).mockResolvedValue(dummyProduct);
      (prisma.productVariant.findMany as any)
        .mockResolvedValueOnce([]) // findByProductId (duplicados check)
        .mockResolvedValueOnce([   // findByProductId (retorno post-createMany)
          makeVariant(1, 'CAM-S-NEGRO', 'S', 'NEGRO'),
          makeVariant(2, 'CAM-S-BLANCO', 'S', 'BLANCO'),
          makeVariant(3, 'CAM-M-NEGRO', 'M', 'NEGRO'),
          makeVariant(4, 'CAM-M-BLANCO', 'M', 'BLANCO'),
        ]);
      (prisma.productVariant.createMany as any).mockResolvedValue({ count: 4 });

      const res = await request(app)
        .post('/api/v1/products/1/variants')
        .set('Authorization', 'Bearer mock-token')
        .send({
          attributes: {
            talla: ['S', 'M'],
            color: ['NEGRO', 'BLANCO'],
          },
          basePrice: 99.90,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      // Verificar 4 variantes generadas
      const { variants } = res.body.data;
      expect(variants).toHaveLength(4);

      // Verificar que los SKUs son únicos
      const skus = variants.map((v: any) => v.sku);
      const uniqueSkus = new Set(skus);
      expect(uniqueSkus.size).toBe(4);

      // Verificar patrón de SKU: CODIGO-TALLA-COLOR
      expect(skus).toContain('CAM-S-NEGRO');
      expect(skus).toContain('CAM-S-BLANCO');
      expect(skus).toContain('CAM-M-NEGRO');
      expect(skus).toContain('CAM-M-BLANCO');
    });

    it('✅ debe retornar 404 si el producto no existe', async () => {
      (prisma.product.findUnique as any).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/products/999/variants')
        .set('Authorization', 'Bearer mock-token')
        .send({ attributes: { talla: ['S'] }, basePrice: 50 });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('no existe');
    });

    it('✅ debe retornar 409 si algún SKU ya existe para ese producto', async () => {
      (prisma.product.findUnique as any).mockResolvedValue(dummyProduct);
      // Variante CAM-S-NEGRO ya existe
      (prisma.productVariant.findMany as any).mockResolvedValue([
        makeVariant(1, 'CAM-S-NEGRO', 'S', 'NEGRO'),
      ]);

      const res = await request(app)
        .post('/api/v1/products/1/variants')
        .set('Authorization', 'Bearer mock-token')
        .send({ attributes: { talla: ['S'], color: ['NEGRO'] }, basePrice: 50 });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('CAM-S-NEGRO');
    });

    it('✅ debe retornar 400 si basePrice es negativo (validación Zod)', async () => {
      const res = await request(app)
        .post('/api/v1/products/1/variants')
        .set('Authorization', 'Bearer mock-token')
        .send({ attributes: { talla: ['S'] }, basePrice: -10 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors[0].message).toContain('mayor a 0');
    });

    it('✅ debe retornar 400 si attributes está vacío (validación Zod)', async () => {
      const res = await request(app)
        .post('/api/v1/products/1/variants')
        .set('Authorization', 'Bearer mock-token')
        .send({ attributes: {}, basePrice: 99 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('✅ debe retornar 400 si ID de producto no es numérico', async () => {
      const res = await request(app)
        .post('/api/v1/products/abc/variants')
        .set('Authorization', 'Bearer mock-token')
        .send({ attributes: { talla: ['S'] }, basePrice: 50 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('ID de producto inválido');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // T-078: PUT /api/v1/variants/:id
  // ─────────────────────────────────────────────────────────────────────────
  describe('PUT /api/v1/variants/:id', () => {
    it('✅ debe actualizar el precio de una variante', async () => {
      (prisma.productVariant.findUnique as any).mockResolvedValue(
        makeVariant(1, 'CAM-S-NEGRO', 'S', 'NEGRO')
      );
      (prisma.productVariant.update as any).mockResolvedValue({
        ...makeVariant(1, 'CAM-S-NEGRO', 'S', 'NEGRO'),
        price: '149.90',
      });

      const res = await request(app)
        .put('/api/v1/variants/1')
        .set('Authorization', 'Bearer mock-token')
        .send({ price: 149.90 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.price).toBe(149.90);
    });

    it('✅ debe actualizar el SKU de una variante con SKU único', async () => {
      (prisma.productVariant.findUnique as any)
        .mockResolvedValueOnce(makeVariant(1, 'CAM-S-NEGRO', 'S', 'NEGRO')) // findById
        .mockResolvedValueOnce(null); // findBySku → no existe → libre para usar
      (prisma.productVariant.update as any).mockResolvedValue({
        ...makeVariant(1, 'CAM-S-BLK', 'S', 'NEGRO'),
      });

      const res = await request(app)
        .put('/api/v1/variants/1')
        .set('Authorization', 'Bearer mock-token')
        .send({ sku: 'CAM-S-BLK' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sku).toBe('CAM-S-BLK');
    });

    it('✅ debe retornar 409 si el SKU nuevo ya está asignado a otra variante', async () => {
      (prisma.productVariant.findUnique as any)
        .mockResolvedValueOnce(makeVariant(1, 'CAM-S-NEGRO', 'S', 'NEGRO')) // variante actual
        .mockResolvedValueOnce(makeVariant(2, 'CAM-M-NEGRO', 'M', 'NEGRO')); // SKU en uso por variante 2

      const res = await request(app)
        .put('/api/v1/variants/1')
        .set('Authorization', 'Bearer mock-token')
        .send({ sku: 'CAM-M-NEGRO' }); // SKU que pertenece a la variante 2

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('ya está asignado');
    });

    it('✅ debe retornar 404 si la variante no existe', async () => {
      (prisma.productVariant.findUnique as any).mockResolvedValue(null);

      const res = await request(app)
        .put('/api/v1/variants/999')
        .set('Authorization', 'Bearer mock-token')
        .send({ price: 50 });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('no existe');
    });

    it('✅ debe retornar 400 si no se envía ningún campo a actualizar (Zod refine)', async () => {
      const res = await request(app)
        .put('/api/v1/variants/1')
        .set('Authorization', 'Bearer mock-token')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('✅ debe retornar 400 si el SKU tiene caracteres inválidos', async () => {
      const res = await request(app)
        .put('/api/v1/variants/1')
        .set('Authorization', 'Bearer mock-token')
        .send({ sku: 'CAM S@#' });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].message).toContain('letras, números');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GET /api/v1/products/:id/variants
  // ─────────────────────────────────────────────────────────────────────────
  describe('GET /api/v1/products/:id/variants', () => {
    it('✅ debe listar todas las variantes de un producto', async () => {
      (prisma.product.findUnique as any).mockResolvedValue(dummyProduct);
      (prisma.productVariant.findMany as any).mockResolvedValue([
        makeVariant(1, 'CAM-S-NEGRO', 'S', 'NEGRO'),
        makeVariant(2, 'CAM-M-BLANCO', 'M', 'BLANCO'),
      ]);

      const res = await request(app)
        .get('/api/v1/products/1/variants')
        .set('Authorization', 'Bearer mock-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].sku).toBe('CAM-S-NEGRO');
    });

    it('✅ debe retornar 404 si el producto no existe', async () => {
      (prisma.product.findUnique as any).mockResolvedValue(null);

      const res = await request(app)
        .get('/api/v1/products/999/variants')
        .set('Authorization', 'Bearer mock-token');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});


