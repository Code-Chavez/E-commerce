import { describe, it, expect, jest, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../app';

/**
 * Integration Tests: POST /api/v1/auth/login (HU-094 / T-024)
 *
 * Strategy: We mock the Prisma client and JwtService so these tests
 * run without a real database, making them fast, deterministic,
 * and suitable for CI environments.
 *
 * Covered scenarios (per Sprint Backlog T-024):
 *  - HTTP 400: Invalid payload (Zod validation)
 *  - HTTP 401: Non-existent email (credential error — no enumeration)
 *  - HTTP 401: Wrong password (credential error — no enumeration)
 *  - HTTP 403: Inactive / unverified account
 *  - HTTP 200: Successful login with valid accessToken + refreshToken
 */

// ---- Mock Prisma to avoid real DB calls ----
jest.mock('@infrastructure/database/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// ---- Mock JwtService to avoid needing JWT_SECRET env var ----
jest.mock('@infrastructure/services/JwtService', () => {
  return {
    JwtService: jest.fn().mockImplementation(() => ({
      generateTokens: jest.fn().mockReturnValue({
        accessToken: 'test.access.token',
        refreshToken: 'test.refresh.token',
      }),
    })),
  };
});

// ---- Mock ResendEmailService to avoid needing RESEND_API_KEY env var ----
jest.mock('@infrastructure/services/ResendEmailService', () => {
  return {
    ResendEmailService: jest.fn().mockImplementation(() => ({
      sendEmail: jest.fn().mockImplementation(() => Promise.resolve()),
    })),
  };
});

import prisma from '@infrastructure/database/prisma';
import bcrypt from 'bcrypt';

const hashedPassword = bcrypt.hashSync('Password123!', 10);

const activeUser = {
  id: 1,
  email: 'active@e-commerce.com',
  name: 'Active User',
  password: hashedPassword,
  lastLogin: null,
  isActive: true,
  verificationPin: null,
  pinExpiresAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const inactiveUser = {
  ...activeUser,
  id: 2,
  email: 'inactive@e-commerce.com',
  isActive: false,
};

describe('POST /api/v1/auth/login (HU-094 / T-024)', () => {
  beforeAll(() => {
    // Ensure update (lastLogin) never throws in integration tests
    (prisma.user.update as jest.MockedFunction<any>).mockResolvedValue({});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  // ---- HTTP 400: Zod validation failures ----

  it('should return 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ password: 'Password123!' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
  });

  it('should return 400 when email format is invalid', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email', password: 'Password123!' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'active@e-commerce.com' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // ---- HTTP 401: Invalid credentials (prevents enumeration) ----

  it('should return 401 with generic error for non-existent email', async () => {
    (prisma.user.findUnique as jest.MockedFunction<any>).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'noexiste@e-commerce.com', password: 'Password123!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Credenciales inválidas');
  });

  it('should return 401 with generic error for wrong password', async () => {
    (prisma.user.findUnique as jest.MockedFunction<any>).mockResolvedValue(activeUser);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'active@e-commerce.com', password: 'WrongPassword!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Credenciales inválidas');
  });

  // ---- HTTP 403: Inactive / unverified account ----

  it('should return 403 for an inactive (unverified) account', async () => {
    (prisma.user.findUnique as jest.MockedFunction<any>).mockResolvedValue(inactiveUser);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'inactive@e-commerce.com', password: 'Password123!' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Cuenta inactiva o no verificada');
  });

  // ---- HTTP 200: Successful login ----

  it('should return 200 with accessToken and refreshToken on valid credentials', async () => {
    (prisma.user.findUnique as jest.MockedFunction<any>).mockResolvedValue(activeUser);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'active@e-commerce.com', password: 'Password123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.tokens.refreshToken).toBeDefined();
  });

  it('should return 200 with user data (without password) on successful login', async () => {
    (prisma.user.findUnique as jest.MockedFunction<any>).mockResolvedValue(activeUser);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'active@e-commerce.com', password: 'Password123!' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.id).toBe(1);
    expect(res.body.data.user.email).toBe('active@e-commerce.com');
    expect(res.body.data.user.password).toBeUndefined();
  });
});


