import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../app';

// Mock Prisma client
jest.mock('@infrastructure/database/prisma', () => {
  const mockProduct = {
    findMany: jest.fn(),
  };

  const mockPrisma: any = {
    product: mockProduct,
  };

  return {
    __esModule: true,
    default: mockPrisma,
  };
});

import prisma from '@infrastructure/database/prisma';

const dummyOnSaleProducts = [
  {
    id: 1,
    code: 'TSHIRT',
    name: 'Camisa Elegante',
    slug: 'camisa-elegante-tshirt',
    description: 'Una bonita camisa',
    categoryId: 2,
    brandId: 3,
    gender: 'M',
    model: 'Model T',
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
        price: 100.0,
        discountPercent: 10,
        isActive: true,
        minStock: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
        branchStock: [
          {
            id: 100,
            variantId: 10,
            branchId: 1,
            quantity: 5,
            status: 'AVAILABLE',
          },
        ],
      },
      {
        id: 11,
        productId: 1,
        sku: 'TSHIRT-L-BLUE',
        price: 150.0,
        discountPercent: 20,
        isActive: true,
        minStock: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
        branchStock: [
          {
            id: 101,
            variantId: 11,
            branchId: 1,
            quantity: 10,
            status: 'AVAILABLE',
          },
        ],
      },
    ],
  },
];

describe('E-commerce On-Sale Products Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.product.findMany as any).mockReset();
  });

  describe('GET /api/v1/ecommerce/products/on-sale', () => {
    it('should return 200 and grouped product data on success with calculated min/max price/discount', async () => {
      (prisma.product.findMany as any).mockResolvedValue(dummyOnSaleProducts);

      const res = await request(app).get('/api/v1/ecommerce/products/on-sale');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);

      const product = res.body.data[0];
      expect(product.slug).toBe('camisa-elegante-tshirt');

      // minDiscount = min(10, 20) = 10
      expect(product.minDiscount).toBe(10);
      // maxDiscount = max(10, 20) = 20
      expect(product.maxDiscount).toBe(20);

      // prices after discount:
      // variant 1: 100 - (100 * 10 / 100) = 90
      // variant 2: 150 - (150 * 20 / 100) = 120
      expect(product.minPrice).toBe(90);
      expect(product.maxPrice).toBe(120);
      expect(product.outOfStock).toBe(false);
    });
  });
});
