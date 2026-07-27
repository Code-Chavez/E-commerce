import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from '@jest/globals';
import { Request, Response, NextFunction } from 'express';

/**
 * RSK-003 / T-048: Integration test — IP whitelist blocks unauthorized IPs
 * and creates an AuditLog record via Prisma.
 *
 * Strategy: mock Prisma and JwtService; call ipWhitelist middleware directly
 * with crafted Request stubs, then assert on HTTP 403 and audit persistence.
 */

var mockAuditLogCreate = jest.fn();
var mockVerifyAccessToken = jest.fn();

jest.mock('@infrastructure/database/prisma', () => ({
  __esModule: true,
  default: {
    auditLog: { create: mockAuditLogCreate },
    user: { findUnique: jest.fn(), update: jest.fn() },
  },
}));

jest.mock('@infrastructure/services/JwtService', () => ({
  JwtService: jest.fn().mockImplementation(() => ({
    verifyAccessToken: mockVerifyAccessToken,
    generateTokens: jest.fn(),
    verifyRefreshToken: jest.fn(),
  })),
}));

import { ipWhitelist } from '@infrastructure/http/middlewares/ipWhitelist.middleware';

const makeReq = (ip: string, authHeader?: string): Partial<Request> => ({
  ip,
  socket: { remoteAddress: ip } as any,
  headers: authHeader ? { authorization: authHeader } : {},
  originalUrl: '/api/v1/roles',
});

const makeRes = (): Partial<Response> => ({
  status: jest.fn().mockReturnThis() as any,
  json: jest.fn().mockReturnThis() as any,
});

describe('ipWhitelist middleware (RSK-003 / T-048)', () => {
  const ORIGINAL_IP_WHITELIST = process.env.IP_WHITELIST;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.IP_WHITELIST = '10.0.0.1';
  });

  afterEach(() => {
    process.env.IP_WHITELIST = ORIGINAL_IP_WHITELIST;
  });

  // ------------------------------------------------------------------
  // T-048 CORE: unauthorized IP → HTTP 403 + AuditLog record
  // ------------------------------------------------------------------
  it('T-048 CORE: should return 403 and create AuditLog when IP is not whitelisted', async () => {
    mockAuditLogCreate.mockResolvedValue({ id: 1 } as never);

    const req = makeReq('9.9.9.9');
    const res = makeRes();
    const next = jest.fn() as unknown as NextFunction;

    await ipWhitelist(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: expect.stringContaining('IP no autorizada'),
    });
    expect(next).not.toHaveBeenCalled();

    expect(mockAuditLogCreate).toHaveBeenCalledTimes(1);
    expect(mockAuditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'BLOCKED_IP',
          module: 'SECURITY',
          details: expect.objectContaining({ ip: '9.9.9.9' }),
        }),
      })
    );
  });

  it('should include userId in AuditLog when a valid JWT is present', async () => {
    mockAuditLogCreate.mockResolvedValue({ id: 2 } as never);
    mockVerifyAccessToken.mockReturnValue({
      userId: 42,
      email: 'u@test.com',
      role: 'ADMIN',
    });

    const req = makeReq('9.9.9.9', 'Bearer some.valid.token');
    const res = makeRes();
    const next = jest.fn() as unknown as NextFunction;

    await ipWhitelist(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockAuditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 42 }),
      })
    );
  });

  it('should call next() and NOT create AuditLog when IP is whitelisted', async () => {
    const req = makeReq('10.0.0.1');
    const res = makeRes();
    const next = jest.fn() as unknown as NextFunction;

    await ipWhitelist(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(mockAuditLogCreate).not.toHaveBeenCalled();
  });

  it('should call next() for all IPs when IP_WHITELIST is empty', async () => {
    process.env.IP_WHITELIST = '';

    const req = makeReq('1.2.3.4');
    const res = makeRes();
    const next = jest.fn() as unknown as NextFunction;

    await ipWhitelist(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(mockAuditLogCreate).not.toHaveBeenCalled();
  });
});
