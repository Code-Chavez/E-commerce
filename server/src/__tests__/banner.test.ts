import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../app';

// Mock Prisma
jest.mock('@infrastructure/database/prisma', () => {
  const mockBanner = {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const mockUser = {
    findUnique: jest.fn(),
  };

  const mockPrisma: any = {
    banner: mockBanner,
    user: mockUser,
    $transaction: jest.fn().mockImplementation(async (cb: any): Promise<any> => cb(mockPrisma)),
  };

  return { __esModule: true, default: mockPrisma };
});

// Mock JwtService
jest.mock('@infrastructure/services/JwtService', () => ({
  JwtService: jest.fn().mockImplementation(() => ({
    verifyAccessToken: jest.fn().mockReturnValue({
      userId: 1,
      email: 'admin@e-commerce.com',
      role: 'SUPERADMIN',
    }),
  })),
}));

// Mock StorageService
jest.mock('@infrastructure/services/CloudinaryStorageService', () => ({
  CloudinaryStorageService: jest.fn().mockImplementation(() => ({
    uploadImage: jest.fn().mockImplementation(() => Promise.resolve('https://res.cloudinary.com/demo/image/upload/v12345/banners/banner1.png')),
  })),
}));

import prisma from '@infrastructure/database/prisma';

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

const dummyBanner = {
  id: 1,
  imageUrl: 'https://res.cloudinary.com/demo/image/upload/v12345/banners/banner1.png',
  linkUrl: 'https://e-commerce.com/collections/autumn',
  order: 0,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Tests de Integración — HU-019: Gestión de Banners y Sliders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.user.findUnique as any).mockResolvedValue(dummyAdmin);
  });

  describe('GET /api/v1/ecommerce/banners (Público)', () => {
    it('debe retornar únicamente los banners activos ordenados por el campo order', async () => {
      (prisma.banner.findMany as any).mockResolvedValue([dummyBanner]);

      const res = await request(app)
        .get('/api/v1/ecommerce/banners')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(1);

      expect(prisma.banner.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
          orderBy: { order: 'asc' },
        })
      );
    });
  });

  describe('POST /api/v1/banners (Admin)', () => {
    it('debe crear un banner correctamente si se envía la imagen', async () => {
      (prisma.banner.create as any).mockResolvedValue(dummyBanner);

      const res = await request(app)
        .post('/api/v1/banners')
        .set('Authorization', 'Bearer mock-token')
        .attach('image', Buffer.from('fake-image-data'), 'banner.png')
        .field('linkUrl', 'https://e-commerce.com/collections/autumn')
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.imageUrl).toBeDefined();
    });

    it('debe fallar con 400 si falta el archivo de imagen', async () => {
      const res = await request(app)
        .post('/api/v1/banners')
        .set('Authorization', 'Bearer mock-token')
        .send({ linkUrl: 'https://e-commerce.com' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('imagen');
    });
  });

  describe('PATCH /api/v1/banners/reorder (Admin)', () => {
    it('debe reordenar masivamente banners en base a IDs', async () => {
      (prisma.banner.update as any).mockResolvedValue(dummyBanner);

      const res = await request(app)
        .patch('/api/v1/banners/reorder')
        .set('Authorization', 'Bearer mock-token')
        .send({
          orders: [
            { id: 1, order: 2 },
            { id: 2, order: 1 },
          ],
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('reordenados');
    });
  });
});


