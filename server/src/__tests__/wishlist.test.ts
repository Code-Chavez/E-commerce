import request from 'supertest';
import app from '../app';
import prisma from '@infrastructure/database/prisma';

// Mock Auth Middleware
jest.mock('@infrastructure/http/middlewares/auth.middleware', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.auth = { userId: 1, role: 'CLIENT' };
    next();
  },
  requirePermission: () => (req: any, res: any, next: any) => {
    req.auth = { userId: 1, role: 'CLIENT' };
    next();
  },
  requireRole: () => (req: any, res: any, next: any) => {
    req.auth = { userId: 1, role: 'CLIENT' };
    next();
  },
  optionalAuth: (req: any, res: any, next: any) => {
    req.auth = { userId: 1, role: 'CLIENT' };
    next();
  },
}));

// Mock Prisma
jest.mock('@infrastructure/database/prisma', () => ({
  __esModule: true,
  default: {
    wishlist: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
    },
    productVariant: {
      findUnique: jest.fn(),
    },
  },
}));

describe('Wishlist API (HU-010)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/wishlist', () => {
    it('should get the wishlist successfully (Happy Path)', async () => {
      (prisma.wishlist.findMany as jest.Mock).mockResolvedValue([
        { id: 1, userId: 1, variantId: 1, addedAt: new Date() },
      ]);

      const response = await request(app).get('/api/v1/wishlist');

      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
    });

    it('should handle errors when fetching wishlist (Error Case)', async () => {
      (prisma.wishlist.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app).get('/api/v1/wishlist');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/wishlist/:variantId', () => {
    it('should add item to wishlist if not exists (Happy Path)', async () => {
      (prisma.productVariant.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
      });
      (prisma.wishlist.findUnique as jest.Mock).mockResolvedValue(null); // Not in wishlist
      (prisma.wishlist.create as jest.Mock).mockResolvedValue({
        id: 1,
        userId: 1,
        variantId: 1,
      });

      const response = await request(app).post('/api/v1/wishlist/1');

      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('agregado');
    });

    it('should remove item from wishlist if it already exists (Happy Path)', async () => {
      (prisma.productVariant.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
      });
      (prisma.wishlist.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        userId: 1,
        variantId: 1,
      }); // Exists
      (prisma.wishlist.delete as jest.Mock).mockResolvedValue({ id: 1 });

      const response = await request(app).post('/api/v1/wishlist/1');

      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('eliminado');
    });

    it('should fail if variant does not exist (Error Case)', async () => {
      (prisma.productVariant.findUnique as jest.Mock).mockResolvedValue(null); // Variant missing

      const response = await request(app).post('/api/v1/wishlist/999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
