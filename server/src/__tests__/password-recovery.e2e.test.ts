import { describe, it, expect, jest, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';

// IMPORTANT: 'var' variables prefixed with 'mock' ARE hoisted and accessible inside jest.mock()
var mockJwtGenerate = jest.fn();
var mockJwtVerify = jest.fn();

jest.mock('@infrastructure/database/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@infrastructure/services/ResendEmailService', () => ({
  ResendEmailService: jest.fn().mockImplementation(() => ({
    sendEmail: jest.fn().mockImplementation(() => Promise.resolve()),
  })),
}));

jest.mock('@infrastructure/services/JwtService', () => ({
  JwtService: jest.fn().mockImplementation(() => ({
    generatePasswordResetToken: mockJwtGenerate,
    verifyPasswordResetToken: mockJwtVerify,
  })),
}));

import app from '../app';
import prisma from '@infrastructure/database/prisma';
import bcrypt from 'bcrypt';

const mockUser = {
  id: 42,
  email: 'exists@e-commerce.com',
  isActive: true,
  password: 'hashedpassword',
};

describe('Password Recovery Integration Flow (HU-003)', () => {
  beforeAll(() => {
    (prisma.user.update as jest.MockedFunction<any>).mockResolvedValue({});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/v1/auth/forgot-password (T-027)', () => {
    it('should return 400 if email format is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'not-an-email' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 200 and generate token if user exists and is active', async () => {
      (prisma.user.findUnique as jest.MockedFunction<any>).mockResolvedValue(mockUser);
      mockJwtGenerate.mockReturnValue('dummy.jwt.token');

      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'exists@e-commerce.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('recibirás un enlace');
      expect(mockJwtGenerate).toHaveBeenCalled();
    });

    it('should return 200 (silent) even if user does NOT exist (security feature)', async () => {
      (prisma.user.findUnique as jest.MockedFunction<any>).mockResolvedValue(null);
      mockJwtGenerate.mockClear();

      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'notexists@e-commerce.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockJwtGenerate).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/auth/reset-password (T-028 & T-029)', () => {
    it('should return 400 if payload is missing token or password is weak', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: 'valid.token', newPassword: '123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('RF-T029: should return 401 with { success: false } if the token is EXPIRED', async () => {
      const expirationError = new Error('jwt expired');
      expirationError.name = 'TokenExpiredError';
      
      mockJwtVerify.mockImplementation(() => {
        throw expirationError;
      });

      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: 'expired.token', newPassword: 'NewSecurePass123!' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('ha expirado');
    });

    it('should return 401 with { success: false } if the token is INVALID (tampered)', async () => {
      const invalidError = new Error('invalid signature');
      invalidError.name = 'JsonWebTokenError';
      
      mockJwtVerify.mockImplementation(() => {
        throw invalidError;
      });

      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: 'fake.token', newPassword: 'NewSecurePass123!' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('no es válido');
    });

    it('should return 200 and update the database if token is valid and password meets requirements', async () => {
      mockJwtVerify.mockImplementation(() => ({
        userId: 42,
        email: 'exists@e-commerce.com',
        purpose: 'password-reset',
        hashFragment: mockUser.password.slice(-10),
      }));
      (prisma.user.findUnique as jest.MockedFunction<any>).mockResolvedValue(mockUser);
      (prisma.user.update as jest.MockedFunction<any>).mockClear();

      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: 'valid.token.here', newPassword: 'NewSecurePass123!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('con éxito');
      expect(prisma.user.update).toHaveBeenCalledTimes(1);
    });

    it('should return 400 if the token has already been used (hashFragment mismatch)', async () => {
      mockJwtVerify.mockImplementation(() => ({
        userId: 42,
        email: 'exists@e-commerce.com',
        purpose: 'password-reset',
        hashFragment: 'old_hash', // Mismatch with mockUser.password.slice(-10)
      }));
      (prisma.user.findUnique as jest.MockedFunction<any>).mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: 'valid.token.here', newPassword: 'NewSecurePass123!' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('ya fue utilizado');
    });

    it('should return 400 if the new password is identical to the current password', async () => {
      const hash = bcrypt.hashSync('OldSecurePass123!', 10);
      const existingUserWithPass = { ...mockUser, password: hash };

      mockJwtVerify.mockImplementation(() => ({
        userId: 42,
        email: 'exists@e-commerce.com',
        purpose: 'password-reset',
      }));
      (prisma.user.findUnique as jest.MockedFunction<any>).mockResolvedValue(existingUserWithPass);

      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: 'valid.token.here', newPassword: 'OldSecurePass123!' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('no puede ser igual a la actual');
    });
  });
});


