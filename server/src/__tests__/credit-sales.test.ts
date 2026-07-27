import request from 'supertest';
import app from '../app';

jest.mock('@application/use-cases/credits/RegisterCreditUseCase', () => ({
  RegisterCreditUseCase: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue({ id: 1, clientId: 1, totalAmount: 1000, pendingBalance: 1000, status: 'PENDING' } as never),
  })),
}));

jest.mock('@application/use-cases/credits/RegisterPaymentUseCase', () => ({
  RegisterPaymentUseCase: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue({ id: 1, creditId: 1, amount: 500, date: new Date() } as never),
  })),
}));

jest.mock('@application/use-cases/credits/GetPendingBalanceUseCase', () => ({
  GetPendingBalanceUseCase: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue({ totalPending: 500, credits: [] } as never),
  })),
}));

// Mock Auth Middleware
jest.mock('@infrastructure/http/middlewares/auth.middleware', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.auth = { userId: 1, role: 'SELLER' };
    next();
  },
  requirePermission: () => (req: any, res: any, next: any) => {
    req.auth = { userId: 1, role: 'SELLER' };
    next();
  },
  requireRole: () => (req: any, res: any, next: any) => {
    req.auth = { userId: 1, role: 'SELLER' };
    next();
  },
  optionalAuth: (req: any, res: any, next: any) => {
    req.auth = { userId: 1, role: 'SELLER' };
    next();
  },
}));

describe('Credit Sales API (HU-017)', () => {
  describe('POST /api/v1/credits', () => {
    it('should register a credit sale successfully (Happy Path)', async () => {
      const payload = {
        clientId: 1,
        totalAmount: 1000,
        installments: 3,
        dueDate: '2026-12-31T00:00:00Z',
      };
      const response = await request(app)
        .post('/api/v1/credits')
        .send(payload);

      expect([200, 201]).toContain(response.status);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('status', 'PENDING');
    });

    it('should fail with missing data (Error Case)', async () => {
      const response = await request(app)
        .post('/api/v1/credits')
        .send({ clientId: 1, totalAmount: -100 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/credits/:id/payments', () => {
    it('should register a payment successfully (Happy Path)', async () => {
      const response = await request(app)
        .post('/api/v1/credits/1/payments')
        .send({ amount: 500 });

      expect([200, 201]).toContain(response.status);
      expect(response.body).toHaveProperty('amount', 500);
    });

    it('should fail with invalid amount (Error Case)', async () => {
      const response = await request(app)
        .post('/api/v1/credits/1/payments')
        .send({ amount: -500 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/v1/credits', () => {
    it('should get pending balance for a client (Happy Path)', async () => {
      const response = await request(app)
        .get('/api/v1/credits?clientId=1');

      expect([200, 201]).toContain(response.status);
      expect(response.body).toHaveProperty('totalPending', 500);
    });

    it('should fail if no clientId provided (Error Case)', async () => {
      const response = await request(app)
        .get('/api/v1/credits');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});
