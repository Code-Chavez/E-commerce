import request from 'supertest';
import app from '../app';
import prisma from '@infrastructure/database/prisma';

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

jest.mock('@infrastructure/database/prisma', () => ({
  __esModule: true,
  default: {
    cart: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    cartItem: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    productVariant: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(prisma)),
  },
}));

describe('E-Commerce Cart API (HU-041)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockCartResponse = {
    id: 1,
    userId: 1,
    sessionId: null,
    items: [
      {
        id: 1,
        cartId: 1,
        variantId: 1,
        quantity: 2,
        variant: {
          id: 1,
          productId: 1,
          price: 100,
          discountPercent: 10,
          product: { name: 'Test Product' },
          branchStock: [{ quantity: 10 }],
        },
      },
    ],
  };

  describe('GET /api/v1/cart', () => {
    it('should get the user cart (Happy Path)', async () => {
      (prisma.cart.findFirst as jest.Mock).mockResolvedValue(mockCartResponse);

      const response = await request(app).get('/api/v1/cart');

      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(1);
    });

    it('should return empty cart if none exists (Happy Path)', async () => {
      (prisma.cart.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/v1/cart');

      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeNull();
    });
  });

  describe('POST /api/v1/cart/items', () => {
    it('should add item to existing cart (Happy Path)', async () => {
      (prisma.productVariant.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
      });
      (prisma.cart.findFirst as jest.Mock).mockResolvedValue(mockCartResponse);
      (prisma.cartItem.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.cartItem.create as jest.Mock).mockResolvedValue({
        id: 2,
        cartId: 1,
        variantId: 1,
        quantity: 1,
      });
      (prisma.cart.findUnique as jest.Mock).mockResolvedValue(mockCartResponse);

      const response = await request(app)
        .post('/api/v1/cart/items')
        .send({ variantId: 1, quantity: 1 });

      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
    });

    it('should create new cart if not exists (Happy Path)', async () => {
      (prisma.productVariant.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
      });
      (prisma.cart.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.cart.create as jest.Mock).mockResolvedValue({ id: 2, userId: 1 });
      (prisma.cartItem.create as jest.Mock).mockResolvedValue({
        id: 2,
        cartId: 2,
        variantId: 1,
        quantity: 1,
      });
      (prisma.cart.findUnique as jest.Mock).mockResolvedValue({
        ...mockCartResponse,
        id: 2,
      });

      const response = await request(app)
        .post('/api/v1/cart/items')
        .send({ variantId: 1, quantity: 1 });

      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
    });
  });

  describe('PATCH /api/v1/cart/items/:id', () => {
    it('should update item quantity (Happy Path)', async () => {
      (prisma.cartItem.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        cartId: 1,
      });
      (prisma.cart.findFirst as jest.Mock).mockResolvedValue(mockCartResponse);
      (prisma.cartItem.update as jest.Mock).mockResolvedValue({
        id: 1,
        quantity: 5,
      });
      (prisma.cart.findUnique as jest.Mock).mockResolvedValue(mockCartResponse);

      const response = await request(app)
        .patch('/api/v1/cart/items/1')
        .send({ quantity: 5 });

      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
    });

    it('should handle missing item (Error Case)', async () => {
      (prisma.cartItem.update as jest.Mock).mockRejectedValueOnce(
        new Error('Record to update not found.')
      );

      const response = await request(app)
        .patch('/api/v1/cart/items/999')
        .send({ quantity: 5 });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/cart/items/:id', () => {
    it('should remove item from cart (Happy Path)', async () => {
      (prisma.cartItem.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        cartId: 1,
      });
      (prisma.cart.findFirst as jest.Mock).mockResolvedValue(mockCartResponse);
      (prisma.cartItem.delete as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.cart.findUnique as jest.Mock).mockResolvedValue(mockCartResponse);

      const response = await request(app).delete('/api/v1/cart/items/1');

      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/cart/merge', () => {
    it('should merge session cart with user cart (Happy Path)', async () => {
      (prisma.cart.findUnique as jest.Mock)
        .mockResolvedValueOnce({
          id: 2,
          sessionId: 'sess123',
          items: [{ variantId: 1, quantity: 1 }],
        }) // anonymousCart
        .mockResolvedValueOnce(mockCartResponse); // cartFull query at the end

      (prisma.cart.findFirst as jest.Mock).mockResolvedValueOnce({
        id: 1,
        userId: 1,
        items: [],
      }); // userCart

      (prisma.cartItem.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.cartItem.create as jest.Mock).mockResolvedValue({});
      (prisma.cart.delete as jest.Mock).mockResolvedValue({});
      (prisma.cart.findUnique as jest.Mock).mockResolvedValue(mockCartResponse);

      const response = await request(app)
        .post('/api/v1/cart/merge')
        .set('x-session-id', 'sess123');

      if (response.status === 500) {
        console.error('MERGE CART 500 ERROR:', response.body);
      }

      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
    });
  });
});
