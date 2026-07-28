import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../app';
import prisma from '@infrastructure/database/prisma';

// Mock Prisma Client
jest.mock('@infrastructure/database/prisma', () => {
  const mockReturnRequest = {
    findUnique: jest.fn(),
    update: jest.fn(),
  };

  const mockCreditNote = {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
  };

  const mockBranch = {
    findFirst: jest.fn(),
  };

  const mockBranchStock = {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const mockKardexEntry = {
    findFirst: jest.fn(),
    create: jest.fn(),
  };

  const mockUser = {
    findUnique: jest.fn(),
  };

  const mockOrder = {
    update: jest.fn(),
  };

  const mockPrisma: any = {
    $transaction: jest.fn((callback: any) => callback(mockPrisma)),
    returnRequest: mockReturnRequest,
    creditNote: mockCreditNote,
    branch: mockBranch,
    branchStock: mockBranchStock,
    kardexEntry: mockKardexEntry,
    user: mockUser,
    order: mockOrder,
  };

  return { __esModule: true, default: mockPrisma };
});

// Mock Adapters
jest.mock('@infrastructure/adapters/PdfGeneratorAdapter', () => {
  return {
    PdfGeneratorAdapter: jest.fn().mockImplementation(() => ({
      generateCreditNotePdf: (jest.fn() as any).mockResolvedValue(
        Buffer.from('mock-pdf-content')
      ),
    })),
  };
});

jest.mock('@infrastructure/adapters/ResendEmailSenderAdapter', () => {
  return {
    ResendEmailSenderAdapter: jest.fn().mockImplementation(() => ({
      sendEmailWithAttachment: (jest.fn() as any).mockResolvedValue(undefined),
    })),
  };
});

const mockTokenPayload = {
  userId: 1,
  email: 'admin@example.com',
  role: 'ADMIN',
};

// Mock JwtService for requireAuth
jest.mock('@infrastructure/services/JwtService', () => ({
  JwtService: jest.fn().mockImplementation(() => ({
    verifyAccessToken: jest.fn().mockImplementation(() => {
      return mockTokenPayload;
    }),
  })),
}));

describe('Credit Note Endpoints', () => {
  let userMockDb: Record<number, any> = {};

  beforeEach(() => {
    jest.clearAllMocks();

    mockTokenPayload.userId = 1;
    mockTokenPayload.role = 'ADMIN';

    userMockDb = {
      1: {
        id: 1,
        email: 'admin@example.com',
        isActive: true,
        roles: [{ name: 'ADMIN' }],
      },
      2: {
        id: 2,
        email: 'user@example.com',
        isActive: true,
        roles: [{ name: 'CLIENT' }],
      },
    };

    (prisma.user.findUnique as any).mockImplementation((args: any) => {
      const id = args?.where?.id;
      return Promise.resolve(userMockDb[id] || null);
    });
  });

  describe('POST /api/v1/admin/returns/:id/credit-note', () => {
    it('should issue a credit note and revert stock successfully for admin user', async () => {
      const mockReturnRequest = {
        id: 10,
        refundType: 'CREDIT_NOTE',
        user: {
          name: 'John Doe',
          email: 'john@example.com',
        },
        items: [
          {
            qty: 2,
            orderItem: {
              unitPrice: 15.5,
              variantId: 100,
              variant: {
                product: {
                  name: 'T-Shirt',
                },
              },
            },
          },
        ],
      };

      (prisma.returnRequest.findUnique as any).mockResolvedValueOnce(
        mockReturnRequest
      );
      (prisma.creditNote.findUnique as any).mockResolvedValueOnce(null); // No existing credit note
      (prisma.branch.findFirst as any).mockResolvedValue({
        id: 1,
        isMain: true,
        isActive: true,
      });
      (prisma.branchStock.findUnique as any).mockResolvedValue({
        id: 5,
        variantId: 100,
        branchId: 1,
        quantity: 10,
      });
      (prisma.kardexEntry.findFirst as any).mockResolvedValue({
        id: 2,
        unitCost: 10.0,
        balanceCost: 100.0,
      });

      (prisma.creditNote.create as any).mockResolvedValue({
        id: 1,
        returnRequestId: 10,
        amount: 31.0,
        type: 'CREDIT_NOTE',
        code: 'NC-12345678',
        createdAt: new Date(),
      });

      const response = await request(app)
        .post('/api/v1/admin/returns/10/credit-note')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.amount).toBe(31.0);
      expect(response.body.data.code).toBe('NC-12345678');

      expect(prisma.branchStock.update).toHaveBeenCalled();
      expect(prisma.kardexEntry.create).toHaveBeenCalled();
    });

    it('should return 403 Forbidden for non-admin user', async () => {
      mockTokenPayload.userId = 2;
      mockTokenPayload.role = 'CLIENT';

      const response = await request(app)
        .post('/api/v1/admin/returns/10/credit-note')
        .set('Authorization', 'Bearer client-token');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Acceso denegado');
    });

    it('should return 400 if return request does not exist', async () => {
      (prisma.returnRequest.findUnique as any).mockResolvedValueOnce(null);

      const response = await request(app)
        .post('/api/v1/admin/returns/999/credit-note')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    it('should return 400 if credit note was already issued', async () => {
      const mockReturnRequest = {
        id: 10,
        refundType: 'CREDIT_NOTE',
        user: { name: 'John Doe', email: 'john@example.com' },
        items: [],
      };

      (prisma.returnRequest.findUnique as any).mockResolvedValueOnce(
        mockReturnRequest
      );
      (prisma.creditNote.findUnique as any).mockResolvedValueOnce({
        id: 1,
        code: 'NC-ALREADY',
      });

      const response = await request(app)
        .post('/api/v1/admin/returns/10/credit-note')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already been issued');
    });
  });

  describe('GET /api/v1/admin/credit-notes', () => {
    it('should list all credit notes for admin', async () => {
      const mockNotes = [
        {
          id: 1,
          code: 'NC-1',
          amount: 50.0,
          type: 'CREDIT_NOTE',
          createdAt: new Date(),
          returnRequest: {
            user: {
              name: 'John Doe',
              email: 'john@example.com',
            },
          },
        },
      ];

      (prisma.creditNote.findMany as any).mockResolvedValueOnce(mockNotes);

      const response = await request(app)
        .get('/api/v1/admin/credit-notes')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].code).toBe('NC-1');
      expect(response.body.data[0].client.name).toBe('John Doe');
    });
  });

  describe('POST /api/v1/admin/credit-notes/:id/resend', () => {
    it('should resend credit note successfully', async () => {
      const mockCreditNote = {
        id: 1,
        code: 'NC-1',
        amount: 50.0,
        type: 'CREDIT_NOTE',
        createdAt: new Date(),
        returnRequest: {
          items: [
            {
              qty: 1,
              orderItem: {
                unitPrice: 50.0,
                variant: {
                  product: {
                    name: 'T-Shirt',
                  },
                },
              },
            },
          ],
          user: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      };

      (prisma.creditNote.findUnique as any).mockResolvedValueOnce(
        mockCreditNote
      );

      const response = await request(app)
        .post('/api/v1/admin/credit-notes/1/resend')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('resent successfully');
    });

    it('should return 404 if credit note not found', async () => {
      (prisma.creditNote.findUnique as any).mockResolvedValueOnce(null);

      const response = await request(app)
        .post('/api/v1/admin/credit-notes/999/resend')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });
});
