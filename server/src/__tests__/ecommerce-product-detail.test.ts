import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../app';

// Mock Prisma client
jest.mock('@infrastructure/database/prisma', () => {
  const mockProduct = {
    findFirst: jest.fn(),
    create: jest.fn(),
  };
  const mockBranch = {
    findFirst: jest.fn(),
  };

  const mockPrisma: any = {
    product: mockProduct,
    branch: mockBranch,
  };

  return {
    __esModule: true,
    default: mockPrisma,
  };
});

import prisma from '@infrastructure/database/prisma';

const dummyProductRecord = {
  id: 1,
  code: 'TSHIRT',
  name: 'Camisa Elegante',
  slug: 'camisa-elegante-tshirt',
  description: 'Una bonita camisa',
  categoryId: 2,
  brandId: 3,
  gender: 'M',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  category: { id: 2, name: 'Camisas' },
  brand: { id: 3, name: 'E-Commerce' },
  images: [{ id: 1, productId: 1, url: '/img.png', isMain: true }],
  variants: [
    {
      id: 10,
      productId: 1,
      sku: 'TSHIRT-M-BLUE',
      price: 49.99,
      attributesJson: { size: 'M', color: 'Blue' },
      isActive: true,
      minStock: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
      branchStock: [
        {
          id: 100,
          variantId: 10,
          branchId: 1,
          quantity: 15,
          status: 'AVAILABLE',
        },
      ],
    },
  ],
};

const dummyMainBranch = {
  id: 1,
  name: 'Main Branch',
  isMain: true,
  isActive: true,
};

describe('E-commerce Product Detail Endpoint — HU-040 (T-166)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.product.findFirst as any).mockReset();
    (prisma.branch.findFirst as any).mockReset();
  });

  describe('GetProductDetailUseCase', () => {
    const {
      GetProductDetailUseCase,
    } = require('../application/use-cases/ecommerce/GetProductDetailUseCase');
    let useCase: any;

    beforeEach(() => {
      useCase = new GetProductDetailUseCase();
    });

    it('should retrieve product detail with stock from main branch', async () => {
      (prisma.branch.findFirst as any).mockResolvedValue(dummyMainBranch);
      (prisma.product.findFirst as any).mockResolvedValue(dummyProductRecord);

      const result = await useCase.execute('camisa-elegante-tshirt');

      expect(result).not.toBeNull();
      expect(result!.slug).toBe('camisa-elegante-tshirt');
      expect(result!.variants[0].stock).toBe(15);
      expect(result!.variants[0].outOfStock).toBe(false);
      expect(result!.sizeGuideUrl).toBeNull();
    });

    it('should return null if product does not exist or is inactive', async () => {
      (prisma.branch.findFirst as any).mockResolvedValue(dummyMainBranch);
      (prisma.product.findFirst as any).mockResolvedValue(null);

      const result = await useCase.execute('non-existent-slug');

      expect(result).toBeNull();
    });
  });

  describe('GET /api/v1/ecommerce/products/:slug', () => {
    it('should return 200 and product data on success', async () => {
      (prisma.branch.findFirst as any).mockResolvedValue(dummyMainBranch);
      (prisma.product.findFirst as any).mockResolvedValue(dummyProductRecord);

      const res = await request(app).get(
        '/api/v1/ecommerce/products/camisa-elegante-tshirt'
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe('camisa-elegante-tshirt');
      expect(res.body.data.variants[0].stock).toBe(15);
    });

    it('should return 404 if product not found', async () => {
      (prisma.branch.findFirst as any).mockResolvedValue(dummyMainBranch);
      (prisma.product.findFirst as any).mockResolvedValue(null);

      const res = await request(app).get(
        '/api/v1/ecommerce/products/invalid-slug'
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
