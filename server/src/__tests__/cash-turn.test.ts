import request from 'supertest';
import app from '../app';

jest.mock('@application/use-cases/pos/OpenCashTurnUseCase', () => ({
  OpenCashTurnUseCase: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue({ id: 1, registerId: 1, userId: 1, openAmount: 100, status: 'OPEN' } as never),
  })),
}));

jest.mock('@application/use-cases/pos/RegisterCashMovementUseCase', () => ({
  RegisterCashMovementUseCase: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue({ id: 1, turnId: 1, type: 'INGRESO', amount: 50, reason: 'Cambio' } as never),
  })),
}));

jest.mock('@application/use-cases/pos/CloseCashTurnUseCase', () => ({
  CloseCashTurnUseCase: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue({ id: 1, registerId: 1, userId: 1, closeAmount: 150, expectedAmount: 150, status: 'CLOSED' } as never),
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

describe('Cash Turn API (HU-010 / HU-032 / HU-037)', () => {
  describe('POST /api/v1/cash-turns/open', () => {
    it('should open a cash turn successfully (Happy Path)', async () => {
      const response = await request(app)
        .post('/api/v1/cash-turns/open')
        .send({ registerId: 1, openAmount: 100 });

      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('OPEN');
    });

    it('should fail with invalid data (Error Case)', async () => {
      const response = await request(app)
        .post('/api/v1/cash-turns/open')
        .send({ registerId: -1, openAmount: -100 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/cash-turns/:id/movements', () => {
    it('should register a movement successfully (Happy Path)', async () => {
      const response = await request(app)
        .post('/api/v1/cash-turns/1/movements')
        .send({ type: 'INGRESO', amount: 50, reason: 'Cambio' });

      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('INGRESO');
    });

    it('should fail with invalid amount (Error Case)', async () => {
      const response = await request(app)
        .post('/api/v1/cash-turns/1/movements')
        .send({ type: 'INGRESO', amount: -50, reason: 'Cambio' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/cash-turns/:id/close', () => {
    it('should close a cash turn successfully (Happy Path)', async () => {
      const response = await request(app)
        .post('/api/v1/cash-turns/1/close')
        .send({ closeAmount: 150 });

      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('CLOSED');
    });
  });
});
