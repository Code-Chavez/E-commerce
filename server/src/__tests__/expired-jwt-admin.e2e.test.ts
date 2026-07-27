import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../app';

/**
 * RSK-001 / T-045: Integration test — expired JWT on admin panel routes.
 *
 * Verifies that any protected admin endpoint (requirePermission middleware)
 * responds with HTTP 401 and the canonical REST envelope { success: false }
 * when the supplied Bearer token is expired.
 *
 * Strategy: mock JwtService.verifyAccessToken to throw a TokenExpiredError,
 * simulating a token whose TTL has elapsed without hitting a real DB or clock.
 */

var mockVerifyAccessToken = jest.fn();

jest.mock('@infrastructure/services/JwtService', () => ({
  JwtService: jest.fn().mockImplementation(() => ({
    verifyAccessToken: mockVerifyAccessToken,
    generateTokens: jest.fn(),
    verifyRefreshToken: jest.fn(),
  })),
}));

jest.mock('@infrastructure/database/prisma', () => ({
  __esModule: true,
  default: {
    user: { findUnique: jest.fn(), update: jest.fn() },
    auditLog: { create: jest.fn() },
  },
}));

// Email service is never reached — the RBAC middleware returns 401 before any controller logic
jest.mock('@infrastructure/services/ResendEmailService', () => ({
  ResendEmailService: jest
    .fn()
    .mockImplementation(() => ({ sendEmail: jest.fn() })),
}));

describe('Admin panel — expired JWT → HTTP 401 (RSK-001 / T-045)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('T-045 CORE: should return 401 + { success: false } when access token is expired', async () => {
    // Force verifyAccessToken to simulate an expired token condition
    mockVerifyAccessToken.mockImplementation(() => {
      const err = new Error('jwt expired');
      err.name = 'TokenExpiredError';
      throw err;
    });

    const res = await request(app)
      .post('/api/v1/roles')
      .set('Authorization', 'Bearer expired.jwt.token')
      .send({ name: 'TEST_ROLE' });

    // Core T-045 assertion: HTTP 401 with REST envelope { success: false }
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
  });

  it('should return 401 + { success: false } when token signature is invalid', async () => {
    mockVerifyAccessToken.mockImplementation(() => {
      const err = new Error('invalid signature');
      err.name = 'JsonWebTokenError';
      throw err;
    });

    const res = await request(app)
      .put('/api/v1/users/1/role')
      .set('Authorization', 'Bearer tampered.jwt.token')
      .send({ role: 'ADMIN' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
  });

  it('should return 401 + { success: false } when Authorization header is absent', async () => {
    const res = await request(app)
      .post('/api/v1/roles')
      .send({ name: 'NO_AUTH_ROLE' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
