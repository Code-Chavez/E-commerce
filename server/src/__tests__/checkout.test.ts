import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../app';

// 1. Mock Stripe SDK
jest.mock('stripe', () => {
  const singletonMock = {
    paymentIntents: {
      create: (jest.fn() as any).mockResolvedValue({
        id: 'pi_mock_123',
        client_secret: 'pi_mock_123_secret_abc',
      }),
    },
    webhooks: {
      constructEvent: jest.fn() as any,
    },
  };
  return jest.fn().mockImplementation(() => singletonMock);
});

const mockStripeInstance = require('stripe')();

// 2. Mock Prisma Client
jest.mock('@infrastructure/database/prisma', () => {
  const mockCart = {
    findUnique: jest.fn(),
  };
  const mockAddress = {
    findUnique: jest.fn(),
  };
  const mockDeliveryZone = {
    findMany: jest.fn(),
  };
  const mockBranch = {
    findFirst: jest.fn(),
  };
  const mockOrder = {
    findUnique: jest.fn(),
    create: jest.fn(),
  };
  const mockOrderItem = {
    create: jest.fn(),
  };
  const mockBranchStock = {
    findUnique: jest.fn(),
    update: jest.fn(),
  };
  const mockKardexEntry = {
    findFirst: jest.fn(),
    create: jest.fn(),
  };
  const mockCartItem = {
    deleteMany: jest.fn(),
  };
  const mockUser = {
    findUnique: jest.fn(),
  };
  const mockLoyaltyConfig = {
    findFirst: jest.fn(),
  };

  const mockPrisma: any = {
    cart: mockCart,
    address: mockAddress,
    deliveryZone: mockDeliveryZone,
    branch: mockBranch,
    order: mockOrder,
    orderItem: mockOrderItem,
    branchStock: mockBranchStock,
    kardexEntry: mockKardexEntry,
    cartItem: mockCartItem,
    user: mockUser,
    loyaltyConfig: mockLoyaltyConfig,
    $transaction: jest
      .fn()
      .mockImplementation(async (cb: any): Promise<any> => cb(mockPrisma)),
  };

  return { __esModule: true, default: mockPrisma };
});

// 3. Mock JwtService for requireAuth
jest.mock('@infrastructure/services/JwtService', () => ({
  JwtService: jest.fn().mockImplementation(() => ({
    verifyAccessToken: jest.fn().mockReturnValue({
      userId: 1,
      email: 'client@example.com',
      role: 'CLIENT',
    }),
  })),
}));

import prisma from '@infrastructure/database/prisma';
import Stripe from 'stripe';

const stripeMockInstance = new Stripe('mock_key') as any;

describe('Tests de Integración — HU-043: Procesamiento de Pago con Stripe y Confirmación de Orden (T-194)', () => {
  const dummyUser = { id: 1, email: 'client@example.com', isActive: true };
  const dummyAddress = {
    id: 5,
    userId: 1,
    alias: 'Casa',
    fullAddress: 'Av Larco 123',
    district: 'Miraflores',
    reference: 'Frente al parque',
  };
  const dummyCart = {
    id: 2,
    userId: 1,
    items: [
      {
        id: 10,
        variantId: 20,
        quantity: 2,
        variant: {
          id: 20,
          sku: 'SKU-JEAN-M-BLUE',
          price: 50.0,
        },
      },
    ],
  };
  const dummyDeliveryZone = {
    id: 1,
    districts: ['Miraflores', 'San Isidro'],
    deliveryCost: 15.0,
    estimatedDays: 2,
  };
  const dummyBranch = {
    id: 1,
    name: 'Principal',
    isMain: true,
    isActive: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.user.findUnique as any).mockResolvedValue(dummyUser);
    (prisma.address.findUnique as any).mockResolvedValue(dummyAddress);
    (prisma.cart.findUnique as any).mockResolvedValue(dummyCart);
    (prisma.deliveryZone.findMany as any).mockResolvedValue([
      dummyDeliveryZone,
    ]);
    (prisma.branch.findFirst as any).mockResolvedValue(dummyBranch);
    (prisma.loyaltyConfig.findFirst as any).mockResolvedValue(null);
  });

  describe('POST /api/v1/checkout/payment-intent', () => {
    it('debe crear un PaymentIntent exitosamente', async () => {
      const res = await request(app)
        .post('/api/v1/checkout/payment-intent')
        .set('Authorization', 'Bearer mock-token')
        .send({ cartId: 2, addressId: 5 });
      expect(res.body.success).toBe(true);
      expect(res.body.data.clientSecret).toBe('pi_mock_123_secret_abc');
    });

    it('debe retornar 400 si faltan parámetros en el cuerpo', async () => {
      const res = await request(app)
        .post('/api/v1/checkout/payment-intent')
        .set('Authorization', 'Bearer mock-token')
        .send({ cartId: 2 })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('cartId y addressId son requeridos');
    });

    it('debe retornar 400 si el carrito no pertenece al usuario autenticado', async () => {
      (prisma.cart.findUnique as any).mockResolvedValue({
        ...dummyCart,
        userId: 99,
      });

      const res = await request(app)
        .post('/api/v1/checkout/payment-intent')
        .set('Authorization', 'Bearer mock-token')
        .send({ cartId: 2, addressId: 5 })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('no pertenece al usuario');
    });
  });

  describe('POST /api/v1/checkout/webhook', () => {
    const mockWebhookSecret = 'whsec_mock_webhook_secret_2026';

    beforeEach(() => {
      process.env.STRIPE_WEBHOOK_SECRET = mockWebhookSecret;
    });

    it('debe crear la orden, descontar stock, registrar Kardex y limpiar carrito al recibir payment_intent.succeeded', async () => {
      const mockEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_succeeded_999',
            metadata: {
              userId: '1',
              cartId: '2',
              addressId: '5',
            },
          },
        },
      };

      // Mockear Stripe constructEvent para retornar el evento simulado
      mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent);

      // Mocks de BD para la transacción
      (prisma.order.findUnique as any).mockResolvedValue(null); // No existe orden anterior (idempotente as never)
      (prisma.branchStock.findUnique as any).mockResolvedValue({
        id: 1,
        variantId: 20,
        branchId: 1,
        quantity: 10,
      });
      (prisma.kardexEntry.findFirst as any).mockResolvedValue({
        id: 5,
        variantId: 20,
        branchId: 1,
        unitCost: 35.0,
        balanceQty: 10,
        balanceCost: 350.0,
      });
      (prisma.order.create as any).mockResolvedValue({
        id: 100,
        userId: 1,
        total: 115.0,
        paymentIntentId: 'pi_test_succeeded_999',
      });

      const res = await request(app)
        .post('/api/v1/checkout/webhook')
        .set('stripe-signature', 't=123,v1=mock_signature')
        .set('Content-Type', 'application/json')
        .send(Buffer.from(JSON.stringify(mockEvent)))
        .expect(200);

      expect(res.body.received).toBe(true);
      expect(res.body.processed).toBe(true);
      expect(res.body.orderId).toBe(100);

      // Verificar aserciones de la transacción atómica
      expect(prisma.order.create).toHaveBeenCalled();
      expect(prisma.orderItem.create).toHaveBeenCalledWith({
        data: {
          orderId: 100,
          variantId: 20,
          qty: 2,
          unitPrice: 50.0,
        },
      });
      expect(prisma.branchStock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            variantId_branchId_status: {
              variantId: 20,
              branchId: 1,
              status: 'AVAILABLE',
            },
          },
          data: {
            quantity: 8,
          },
        })
      );
      expect(prisma.kardexEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            variantId: 20,
            branchId: 1,
            type: 'VENTA',
            quantity: 2,
            unitCost: 35.0,
            balanceQty: 8,
            balanceCost: 280.0, // 350.00 - (2 * 35.00)
          }),
        })
      );
      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cartId: 2 },
      });
    });

    it('debe saltar el procesamiento si la orden ya existe (idempotencia)', async () => {
      const mockEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_succeeded_already_exists',
            metadata: {
              userId: '1',
              cartId: '2',
              addressId: '5',
            },
          },
        },
      };

      mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent);

      // La orden ya existe
      (prisma.order.findUnique as any).mockResolvedValue({
        id: 100,
        paymentIntentId: 'pi_test_succeeded_already_exists',
      });

      const res = await request(app)
        .post('/api/v1/checkout/webhook')
        .set('stripe-signature', 't=123,v1=mock_signature')
        .set('Content-Type', 'application/json')
        .send(Buffer.from(JSON.stringify(mockEvent)));
      console.log(res.body);
      expect(res.status).toBe(200);
      expect(res.body.received).toBe(true);
      expect(res.body.processed).toBe(true);
      expect(res.body.orderId).toBe(100);

      // No se debió volver a crear la orden
      expect(prisma.order.create).not.toHaveBeenCalled();
    });

    it('debe retornar 400 si falla la firma de Stripe', async () => {
      mockStripeInstance.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const res = await request(app)
        .post('/api/v1/checkout/webhook')
        .set('stripe-signature', 'invalid_signature')
        .set('Content-Type', 'application/json')
        .send(Buffer.from(JSON.stringify({ type: 'payment_intent.succeeded' })))
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Error de firma');
    });
  });
});
