import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import prisma from '@infrastructure/database/prisma';
import { AbandonedCartJob } from '../infrastructure/jobs/AbandonedCartJob';

let mockSendEmail = jest.fn<any>().mockResolvedValue(undefined);
jest.mock('@infrastructure/services/ResendEmailService', () => {
  return {
    ResendEmailService: jest.fn().mockImplementation(() => {
      return {
        sendEmail: (to: string, subject: string, html: string) =>
          mockSendEmail(to, subject, html),
      };
    }),
  };
});

jest.mock('@infrastructure/database/prisma', () => ({
  __esModule: true,
  default: {
    cart: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('Abandoned Cart Job (HU-039)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not send emails if no abandoned carts are found', async () => {
    (prisma.cart.findMany as any).mockResolvedValue([]);

    await AbandonedCartJob.processAbandonedCarts();

    expect(prisma.cart.findMany).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(prisma.cart.update).not.toHaveBeenCalled();
  });

  it('should send emails to users with abandoned carts', async () => {
    const mockCarts = [
      {
        id: 1,
        userId: 1,
        user: { name: 'Test User', email: 'test@example.com' },
        items: [
          {
            quantity: 2,
            variant: {
              sku: 'VAR-1',
              price: 100,
              product: {
                name: 'Product 1',
                images: [{ isMain: true, url: 'http://img.com/1.jpg' }],
              },
            },
          },
        ],
      },
    ];

    (prisma.cart.findMany as any).mockResolvedValue(mockCarts);
    (prisma.cart.update as any).mockResolvedValue({});

    await AbandonedCartJob.processAbandonedCarts();

    expect(prisma.cart.findMany).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      'test@example.com',
      expect.stringContaining('¡No olvides tus productos'),
      expect.any(String)
    );
    expect(prisma.cart.update).toHaveBeenCalledTimes(1);
    expect(prisma.cart.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { abandonedEmailSent: true },
    });
  });

  it('should skip carts without user email', async () => {
    const mockCarts = [
      {
        id: 1,
        userId: 1,
        user: { name: 'Test User', email: null }, // no email
        items: [],
      },
    ];

    (prisma.cart.findMany as any).mockResolvedValue(mockCarts);

    await AbandonedCartJob.processAbandonedCarts();

    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(prisma.cart.update).not.toHaveBeenCalled();
  });

  it('should handle email sending errors gracefully', async () => {
    const mockCarts = [
      {
        id: 1,
        userId: 1,
        user: { name: 'Test User', email: 'error@example.com' },
        items: [
          {
            quantity: 1,
            variant: {
              sku: 'VAR-1',
              price: 100,
              product: { name: 'P1', images: [] },
            },
          },
        ],
      },
    ];

    (prisma.cart.findMany as any).mockResolvedValue(mockCarts);
    mockSendEmail.mockRejectedValueOnce(new Error('Send error')); // simulate error

    await AbandonedCartJob.processAbandonedCarts();

    // It should have called sendEmail, but NOT updated the cart
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(prisma.cart.update).not.toHaveBeenCalled();
  });
});
