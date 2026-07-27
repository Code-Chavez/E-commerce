import request from 'supertest';
import app from '../app';

jest.mock('@application/use-cases/returns/CreateReturnRequestUseCase', () => ({
  CreateReturnRequestUseCase: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue({
      id: 1,
      orderId: 1,
      userId: 1,
      status: 'PENDING',
    } as never),
  })),
}));

jest.mock('@application/use-cases/returns/ApproveReturnRequestUseCase', () => ({
  ApproveReturnRequestUseCase: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue({
      id: 1,
      status: 'APPROVED',
      pickupOrderId: 99,
    } as never),
  })),
}));

jest.mock('@application/use-cases/returns/RejectReturnRequestUseCase', () => ({
  RejectReturnRequestUseCase: jest.fn().mockImplementation(() => ({
    execute: jest
      .fn()
      .mockResolvedValue({ id: 1, status: 'REJECTED' } as never),
  })),
}));

jest.mock('@application/use-cases/returns/IssueCreditNoteUseCase', () => ({
  IssueCreditNoteUseCase: jest.fn().mockImplementation(() => ({
    execute: jest
      .fn()
      .mockResolvedValue({ id: 1, code: 'CN-001', amount: 100 } as never),
  })),
}));

// Mock Auth Middleware
jest.mock('@infrastructure/http/middlewares/auth.middleware', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.auth = { userId: 1, role: 'ADMIN' };
    next();
  },
  requirePermission: () => (req: any, res: any, next: any) => {
    req.auth = { userId: 1, role: 'ADMIN' };
    next();
  },
  requireRole: () => (req: any, res: any, next: any) => {
    req.auth = { userId: 1, role: 'ADMIN' };
    next();
  },
  optionalAuth: (req: any, res: any, next: any) => {
    req.auth = { userId: 1, role: 'ADMIN' };
    next();
  },
}));

describe('Returns API (HU-031 / HU-032)', () => {
  describe('POST /api/v1/returns', () => {
    it('should create a return request successfully (Happy Path)', async () => {
      const response = await request(app)
        .post('/api/v1/returns')
        .send({
          orderId: 1,
          reason: 'Defective product',
          refundType: 'STORE_CREDIT',
          items: [{ orderItemId: 1, qty: 1 }],
        });

      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('PENDING');
    });
  });

  describe('PATCH /api/v1/admin/returns/:id/approve', () => {
    it('should approve a return request successfully (Happy Path)', async () => {
      const response = await request(app)
        .patch('/api/v1/admin/returns/1/approve')
        .send({ approvedBy: 1, notes: 'Approved' });

      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('APPROVED');
      expect(response.body.data.pickupOrderId).toBe(99);
    });
  });

  describe('POST /api/v1/admin/returns/:id/credit-note', () => {
    it('should issue a credit note successfully (Happy Path)', async () => {
      const response = await request(app)
        .post('/api/v1/admin/returns/1/credit-note')
        .send({});

      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
      expect(response.body.data.code).toBe('CN-001');
    });
  });
});
