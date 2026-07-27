import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../app';

// Mock Prisma client
jest.mock('@infrastructure/database/prisma', () => {
  const mockCategory = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
  };
  const mockBrand = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
  };

  const mockPrisma: any = {
    category: mockCategory,
    brand: mockBrand,
  };

  return {
    __esModule: true,
    default: mockPrisma,
  };
});

// Mock Auth Middleware
jest.mock('@infrastructure/http/middlewares/auth.middleware', () => ({
  requirePermission: jest.fn(() => (req: any, res: any, next: any) => {
    req.auth = { userId: 1, branchId: 1, role: 'ADMIN' };
    next();
  }),
  requireAuth: jest.fn((req: any, res: any, next: any) => {
    req.auth = { userId: 1, branchId: 1, role: 'ADMIN' };
    next();
  }),
  optionalAuth: jest.fn((req: any, res: any, next: any) => next()),
}));

import prisma from '@infrastructure/database/prisma';

describe('Categories and Brands API (HU011 / HU012)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Categories', () => {
    it('should list all categories successfully (Happy Path)', async () => {
      const mockData = [
        { id: 1, name: 'Polos', slug: 'polos', isActive: true },
      ];
      (prisma.category.findMany as jest.Mock).mockResolvedValue(
        mockData as never
      );

      const response = await request(app).get('/api/v1/categories');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockData);
      expect(prisma.category.findMany).toHaveBeenCalled();
    });

    it('should create a category successfully (Happy Path)', async () => {
      const newCategory = {
        id: 2,
        name: 'Pantalones',
        slug: 'pantalones',
        isActive: true,
      };
      (prisma.category.create as jest.Mock).mockResolvedValue(
        newCategory as never
      );

      const response = await request(app)
        .post('/api/v1/categories')
        .send({ name: 'Pantalones', slug: 'pantalones', displayOrder: 1 });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(newCategory);
      expect(prisma.category.create).toHaveBeenCalled();
    });

    it('should return 400 when missing required fields on creation (Error Case)', async () => {
      const response = await request(app)
        .post('/api/v1/categories')
        .send({ slug: 'invalid-no-name' });

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Brands', () => {
    it('should list all brands successfully (Happy Path)', async () => {
      const mockData = [{ id: 1, name: 'Nike', isActive: true }];
      (prisma.brand.findMany as jest.Mock).mockResolvedValue(mockData as never);

      const response = await request(app).get('/api/v1/brands');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockData);
      expect(prisma.brand.findMany).toHaveBeenCalled();
    });

    it('should create a brand successfully (Happy Path)', async () => {
      const newBrand = { id: 2, name: 'Adidas', isActive: true };
      (prisma.brand.create as jest.Mock).mockResolvedValue(newBrand as never);

      const response = await request(app)
        .post('/api/v1/brands')
        .send({ name: 'Adidas' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(newBrand);
      expect(prisma.brand.create).toHaveBeenCalled();
    });

    it('should return 400 when missing required fields on creation (Error Case)', async () => {
      const response = await request(app).post('/api/v1/brands').send({});

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.success).toBe(false);
    });
  });
});
