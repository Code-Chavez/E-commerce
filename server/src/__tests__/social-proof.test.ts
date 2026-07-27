import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../app';
import prisma from '@infrastructure/database/prisma';

import { CloudinaryStorageService } from '@infrastructure/services/CloudinaryStorageService';

jest.mock('@infrastructure/services/CloudinaryStorageService');

jest.mock('@infrastructure/database/prisma', () => ({
  __esModule: true,
  default: {
    socialProofPhoto: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('@infrastructure/http/middlewares/auth.middleware', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.user = { id: 1, role: 'ADMIN' };
    next();
  },
  optionalAuth: (req: any, res: any, next: any) => next(),
  requirePermission: () => (req: any, res: any, next: any) => next(),
}));

describe('Social Proof API (HU-054)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (CloudinaryStorageService.prototype.uploadImage as any).mockResolvedValue('http://mock.img/file.jpg');
    (CloudinaryStorageService.prototype.deleteImage as any).mockResolvedValue(undefined);
  });

  describe('GET /api/v1/social-proof', () => {
    it('should get all approved social proofs (public)', async () => {
      const mockProofs = [
        { id: 1, clientName: 'Juan', imageUrl: 'url1', isApproved: true },
      ];
      (prisma.socialProofPhoto.findMany as any).mockResolvedValue(mockProofs);

      const response = await request(app).get('/api/v1/social-proof');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProofs);
      expect(prisma.socialProofPhoto.findMany).toHaveBeenCalledWith({
        where: { isApproved: true },
        orderBy: { uploadedAt: 'desc' },
      });
    });
  });

  describe('GET /api/v1/social-proof/admin', () => {
    it('should get all social proofs (admin)', async () => {
      const mockProofs = [
        { id: 1, clientName: 'Juan', imageUrl: 'url1', isApproved: true },
        { id: 2, clientName: 'Maria', imageUrl: 'url2', isApproved: false },
      ];
      (prisma.socialProofPhoto.findMany as any).mockResolvedValue(mockProofs);

      const response = await request(app).get('/api/v1/social-proof/admin');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProofs);
      expect(prisma.socialProofPhoto.findMany).toHaveBeenCalledWith({
        orderBy: { uploadedAt: 'desc' },
      });
    });
  });

  describe('POST /api/v1/social-proof/admin', () => {
    it('should create a new social proof with an image', async () => {
      const mockProof = { id: 1, clientName: 'Test', imageUrl: 'http://mock.img/file.jpg', isApproved: false };
      (prisma.socialProofPhoto.create as any).mockResolvedValue(mockProof);

      const response = await request(app)
        .post('/api/v1/social-proof/admin')
        .field('clientName', 'Test')
        .attach('image', Buffer.from('mock image data'), 'test.jpg');

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockProof);
      expect(CloudinaryStorageService.prototype.uploadImage).toHaveBeenCalled();
      expect(prisma.socialProofPhoto.create).toHaveBeenCalledWith({
        data: { clientName: 'Test', imageUrl: 'http://mock.img/file.jpg', isApproved: false },
      });
    });

    it('should fail if clientName is missing', async () => {
      const response = await request(app)
        .post('/api/v1/social-proof/admin')
        .attach('image', Buffer.from('mock image data'), 'test.jpg');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('El nombre del cliente es requerido');
    });

    it('should fail if image is missing', async () => {
      const response = await request(app)
        .post('/api/v1/social-proof/admin')
        .field('clientName', 'Test');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('La imagen es requerida');
    });
  });

  describe('PATCH /api/v1/social-proof/admin/:id/approve', () => {
    it('should approve or unapprove a social proof', async () => {
      const mockProof = { id: 1, isApproved: true };
      (prisma.socialProofPhoto.update as any).mockResolvedValue(mockProof);

      const response = await request(app)
        .patch('/api/v1/social-proof/admin/1/approve')
        .send({ isApproved: true });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProof);
      expect(prisma.socialProofPhoto.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isApproved: true },
      });
    });

    it('should fail if isApproved is not boolean', async () => {
      const response = await request(app)
        .patch('/api/v1/social-proof/admin/1/approve')
        .send({ isApproved: 'yes' });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/v1/social-proof/admin/:id', () => {
    it('should delete a social proof', async () => {
      const mockProof = { id: 1, imageUrl: 'url1' };
      (prisma.socialProofPhoto.findUnique as any).mockResolvedValue(mockProof);
      (prisma.socialProofPhoto.delete as any).mockResolvedValue({});

      const response = await request(app).delete('/api/v1/social-proof/admin/1');

      expect(response.status).toBe(204);
      expect(CloudinaryStorageService.prototype.deleteImage).toHaveBeenCalledWith('url1');
      expect(prisma.socialProofPhoto.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should return 404 if not found', async () => {
      (prisma.socialProofPhoto.findUnique as any).mockResolvedValue(null);

      const response = await request(app).delete('/api/v1/social-proofs/admin/999');

      expect(response.status).toBe(404);
    });
  });
});
