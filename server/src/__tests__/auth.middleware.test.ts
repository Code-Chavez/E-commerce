import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';

// 1. Setup variable mocks using 'var' and 'mock' prefix to facilitate flawless Jest module hoisting.
let mockVerifyAccessToken = jest.fn();

jest.mock('@infrastructure/services/JwtService', () => ({
  JwtService: jest.fn().mockImplementation(() => ({
    verifyAccessToken: mockVerifyAccessToken,
  })),
}));

jest.mock('@infrastructure/database/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

// 2. Import targets now that isolation infrastructure stands loaded
import { requirePermission } from '@infrastructure/http/middlewares/auth.middleware';
import prisma from '@infrastructure/database/prisma';

describe('requirePermission Middleware (T-041 Unit Test)', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      headers: {},
    };

    // Fabricate Express response stub capturing responses for assertion
    res = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any,
    };

    next = jest.fn() as unknown as NextFunction;
  });

  it('should return 401 if Authorization header is completely missing', async () => {
    const middleware = requirePermission('some:perm');
    await middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('Token faltante'),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if the JWT token is malformed or expired', async () => {
    req.headers!.authorization = 'Bearer invalid.expired.token';

    // Force rejection representing bad signature or time limit exceedance
    const tokenError = new Error('jwt expired');
    tokenError.name = 'TokenExpiredError';
    mockVerifyAccessToken.mockImplementation(() => {
      throw tokenError;
    });

    const middleware = requirePermission('some:perm');
    await middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('Sesión expirada'),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 Forbidden if account exists but is deactivated (isActive: false)', async () => {
    req.headers!.authorization = 'Bearer valid.token';

    mockVerifyAccessToken.mockReturnValue({
      userId: 99,
      email: 'inactive@mail.com',
      role: 'USER',
    });

    // Simulated DB return mapping an inactive participant
    (prisma.user.findUnique as jest.MockedFunction<any>).mockResolvedValue({
      id: 99,
      isActive: false,
      roles: [],
    });

    const middleware = requirePermission('some:perm');
    await middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('cuenta se encuentra inactiva'),
      })
    );
  });

  // =================================================================
  // T-041 CORE COMPLIANCE TEST SCENARIO
  // =================================================================
  it('T-041 CORE: should return 403 with { success: false } if user HAS role but role LACKS target permission', async () => {
    req.headers!.authorization = 'Bearer valid.token';

    mockVerifyAccessToken.mockReturnValue({
      userId: 100,
      email: 'client@mail.com',
      role: 'CLIENT',
    });

    // Simulated persistence lookup: User is ACTIVE, has roles, but roles only hold 'orders:read'
    (prisma.user.findUnique as jest.MockedFunction<any>).mockResolvedValue({
      id: 100,
      isActive: true,
      roles: [
        {
          name: 'CLIENT',
          permissions: [{ name: 'orders:read' }],
        },
      ],
    });

    // Require specific sensitive admin ability that client inherently misses
    const middleware = requirePermission('roles:manage');
    await middleware(req as Request, res as Response, next);

    // Core verification of T-041 condition assertion
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: expect.stringContaining("Se requiere el permiso 'roles:manage'"),
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should gracefully call next() if the user effectively possesses the required capability', async () => {
    req.headers!.authorization = 'Bearer power.user.token';

    mockVerifyAccessToken.mockReturnValue({
      userId: 1,
      email: 'godmode@mail.com',
      role: 'SUPERADMIN',
    });

    // High privilege matrix simulation
    (prisma.user.findUnique as jest.MockedFunction<any>).mockResolvedValue({
      id: 1,
      isActive: true,
      roles: [
        {
          name: 'SUPERADMIN',
          permissions: [{ name: 'users:read' }, { name: 'roles:manage' }],
        },
      ],
    });

    const middleware = requirePermission('roles:manage');
    await middleware(req as Request, res as Response, next);

    // Explicit permission match discovered - allowing bypass
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();

    // Also ensure the principal metadata correctly mounted onto Req object
    expect((req as any).auth).toEqual({
      userId: 1,
      email: 'godmode@mail.com',
      role: 'SUPERADMIN',
    });
  });
});
