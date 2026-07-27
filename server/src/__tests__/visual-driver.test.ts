import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../app';

// 1. Mock Prisma
jest.mock('@infrastructure/database/prisma', () => {
  const mockAttribute = {
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
  };
  const mockProduct = {
    findById: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  };
  const mockProductImage = {
    create: jest.fn(),
    count: jest.fn(),
    updateMany: jest.fn(),
  };
  const mockUser = {
    findUnique: jest.fn(),
  };
  const mockBranch = {
    findFirst: jest.fn(),
  };

  const mockPrisma: any = {
    attribute: mockAttribute,
    product: mockProduct,
    productImage: mockProductImage,
    user: mockUser,
    branch: mockBranch,
    $transaction: jest
      .fn()
      .mockImplementation(async (cb: any): Promise<any> => cb(mockPrisma)),
  };

  return { __esModule: true, default: mockPrisma };
});

// 2. Mock JwtService
jest.mock('@infrastructure/services/JwtService', () => ({
  JwtService: jest.fn().mockImplementation(() => ({
    verifyAccessToken: jest.fn().mockReturnValue({
      userId: 1,
      email: 'admin@e-commerce.com',
      role: 'SUPERADMIN',
    }),
  })),
}));

// Mock CloudinaryStorageService to avoid real network requests
jest.mock('@infrastructure/services/CloudinaryStorageService', () => {
  return {
    CloudinaryStorageService: jest.fn().mockImplementation(() => ({
      uploadImage: (jest.fn() as any).mockResolvedValue(
        'https://res.cloudinary.com/mock/image.png'
      ),
    })),
  };
});

import prisma from '@infrastructure/database/prisma';

const mockAdminUser = {
  id: 1,
  email: 'admin@e-commerce.com',
  isActive: true,
  roles: [
    {
      name: 'SUPERADMIN',
      permissions: [{ name: 'products:read' }, { name: 'products:write' }],
    },
  ],
};

describe('Desacoplamiento Visual y Visual Driver (isVisualDriver)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.user.findUnique as any).mockResolvedValue(mockAdminUser);
  });

  describe('Creación de Atributo con isVisualDriver', () => {
    it('debería ser posible crear un atributo marcado con isVisualDriver: true', async () => {
      const mockCreatedAttribute = {
        id: 1,
        name: 'Color',
        isVisualDriver: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.attribute.create as any).mockResolvedValue(mockCreatedAttribute);

      const res = await request(app)
        .post('/api/v1/attributes')
        .set('Authorization', 'Bearer mock-token')
        .send({
          name: 'Color',
          isVisualDriver: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Color');
      expect(res.body.data.isVisualDriver).toBe(true);
      expect(prisma.attribute.create).toHaveBeenCalledWith({
        data: {
          name: 'Color',
          isVisualDriver: true,
        },
      });
    });
  });

  describe('Subida de Imagen con attributeValueId', () => {
    it('debería asociar la imagen al attributeValueId enviado en el request', async () => {
      const mockProduct = {
        id: 1,
        code: 'NIKE',
        name: 'Zapatilla Nike',
        isActive: true,
      };
      (prisma.product.findUnique as any).mockResolvedValue(mockProduct);
      (prisma.productImage.count as any).mockResolvedValue(0);
      (prisma.productImage.create as any).mockResolvedValue({
        id: 12,
        productId: 1,
        url: 'https://res.cloudinary.com/mock/image.png',
        isMain: true,
        attributeValueId: 5,
      });

      // Buffer ficticio para la imagen
      const dummyBuffer = Buffer.from('dummy-image-content');

      const res = await request(app)
        .post('/api/v1/products/1/images')
        .set('Authorization', 'Bearer mock-token')
        .field('attributeValueId', '5')
        .attach('images', dummyBuffer, 'nike_red.png');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(prisma.productImage.create).toHaveBeenCalledWith({
        data: {
          productId: 1,
          url: 'https://res.cloudinary.com/mock/image.png',
          isMain: true,
          attributeValueId: 5,
        },
      });
    });

    it('debería retornar error 400 si se excede el límite de 4 imágenes por agrupación', async () => {
      const mockProduct = {
        id: 1,
        code: 'NIKE',
        name: 'Zapatilla Nike',
        isActive: true,
      };
      (prisma.product.findUnique as any).mockResolvedValue(mockProduct);
      (prisma.productImage.count as any).mockResolvedValue(4); // Límite alcanzado

      const dummyBuffer = Buffer.from('dummy-image-content');

      const res = await request(app)
        .post('/api/v1/products/1/images')
        .set('Authorization', 'Bearer mock-token')
        .field('attributeValueId', '5')
        .attach('images', dummyBuffer, 'nike_red_extra.png');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('No puedes subir más de 4 imágenes');
    });
  });

  describe('API Pública - Detalle del Producto', () => {
    it('debería retornar la lista de imágenes incluyendo el campo attributeValueId', async () => {
      const mockProductWithImages = {
        id: 1,
        code: 'NIKE',
        name: 'Zapatilla Nike',
        slug: 'zapatilla-nike-nike',
        description: 'Nike Air Force',
        categoryId: 1,
        brandId: 1,
        gender: 'Unisex',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        category: { id: 1, name: 'Calzado' },
        brand: { id: 1, name: 'Nike' },
        images: [
          {
            id: 10,
            productId: 1,
            url: 'img1.png',
            isMain: true,
            attributeValueId: null,
          },
          {
            id: 11,
            productId: 1,
            url: 'img2.png',
            isMain: false,
            attributeValueId: 5,
          }, // Vinculado a Rojo (id 5)
        ],
        variants: [],
      };

      (prisma.branch.findFirst as any).mockResolvedValue({
        id: 1,
        isMain: true,
        isActive: true,
      });
      (prisma.product.findFirst as any).mockResolvedValue(
        mockProductWithImages
      );

      const res = await request(app).get(
        '/api/v1/ecommerce/products/zapatilla-nike-nike'
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.images).toHaveLength(2);
      expect(res.body.data.images[0].attributeValueId).toBeNull();
      expect(res.body.data.images[1].attributeValueId).toBe(5);
    });
  });
});
