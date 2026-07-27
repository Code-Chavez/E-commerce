import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../app';

// Mock Prisma
jest.mock('@infrastructure/database/prisma', () => {
  const mockNewsletterSubscriber = {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  };

  const mockPrisma: any = {
    newsletterSubscriber: mockNewsletterSubscriber,
  };

  return { __esModule: true, default: mockPrisma, prisma: mockPrisma };
});

import prisma from '@infrastructure/database/prisma';

jest.mock('@infrastructure/http/middlewares/auth.middleware', () => {
  return {
    requireAuth: (req: any, res: any, next: any) => {
      const authHeader = req.headers.authorization;
      if (authHeader === 'Bearer admin-token') {
        req.auth = { id: 1, role: { name: 'ADMIN' } };
        return next();
      }
      if (authHeader === 'Bearer user-token') {
        req.auth = { id: 2, role: { name: 'USER' } };
        return next();
      }
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    },
    requirePermission:
      (permission: string) => (req: any, res: any, next: any) =>
        next(),
    requireRole: (role: string) => (req: any, res: any, next: any) => next(),
    optionalAuth: (req: any, res: any, next: any) => next(),
  };
});

import { getAbandonedCartEmailTemplate } from '@infrastructure/services/templates/AbandonedCartTemplate';
import { getBirthdayCouponTemplate } from '@infrastructure/services/templates/BirthdayCouponTemplate';
import { getNPSSurveyTemplate } from '@infrastructure/services/templates/NPSSurveyTemplate';

const dummySubscriber = {
  id: 1,
  email: 'test@example.com',
  isActive: true,
  subscribedAt: new Date(),
};

describe('Tests de Integración — HU-088: Gestión de Suscriptores al Newsletter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/newsletter/subscribe', () => {
    it('debe suscribir un nuevo correo exitosamente', async () => {
      (prisma.newsletterSubscriber.findUnique as any).mockResolvedValue(null);
      (prisma.newsletterSubscriber.create as any).mockResolvedValue(
        dummySubscriber
      );

      const res = await request(app)
        .post('/api/v1/newsletter/subscribe')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('test@example.com');
      expect(res.body.data.isActive).toBe(true);
    });

    it('debe reactivar una suscripción inactiva', async () => {
      const inactiveSub = { ...dummySubscriber, isActive: false };
      (prisma.newsletterSubscriber.findUnique as any).mockResolvedValue(
        inactiveSub
      );
      (prisma.newsletterSubscriber.update as any).mockResolvedValue({
        ...dummySubscriber,
        isActive: true,
      });

      const res = await request(app)
        .post('/api/v1/newsletter/subscribe')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.isActive).toBe(true);
      expect(prisma.newsletterSubscriber.update).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        data: { isActive: true },
      });
    });

    it('debe ser idempotente si ya está activo', async () => {
      (prisma.newsletterSubscriber.findUnique as any).mockResolvedValue(
        dummySubscriber
      );

      const res = await request(app)
        .post('/api/v1/newsletter/subscribe')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.isActive).toBe(true);
      expect(prisma.newsletterSubscriber.create).not.toHaveBeenCalled();
      expect(prisma.newsletterSubscriber.update).not.toHaveBeenCalled();
    });

    it('debe retornar 400 si el email no es válido', async () => {
      const res = await request(app)
        .post('/api/v1/newsletter/subscribe')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/newsletter/unsubscribe', () => {
    it('debe desuscribir un correo activo desde el cuerpo (body)', async () => {
      (prisma.newsletterSubscriber.findUnique as any).mockResolvedValue(
        dummySubscriber
      );
      (prisma.newsletterSubscriber.update as any).mockResolvedValue({
        ...dummySubscriber,
        isActive: false,
      });

      const res = await request(app)
        .delete('/api/v1/newsletter/unsubscribe')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.isActive).toBe(false);
      expect(prisma.newsletterSubscriber.update).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        data: { isActive: false },
      });
    });

    it('debe desuscribir un correo activo desde query params', async () => {
      (prisma.newsletterSubscriber.findUnique as any).mockResolvedValue(
        dummySubscriber
      );
      (prisma.newsletterSubscriber.update as any).mockResolvedValue({
        ...dummySubscriber,
        isActive: false,
      });

      const res = await request(app)
        .delete('/api/v1/newsletter/unsubscribe')
        .query({ email: 'test@example.com' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.isActive).toBe(false);
    });

    it('debe retornar 404 si el suscriptor no existe', async () => {
      (prisma.newsletterSubscriber.findUnique as any).mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/v1/newsletter/unsubscribe')
        .send({ email: 'test@example.com' })
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Subscriber not found');
    });

    it('debe retornar 400 si el email no es válido', async () => {
      const res = await request(app)
        .delete('/api/v1/newsletter/unsubscribe')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });
  describe('GET /api/v1/admin/newsletter/subscribers', () => {
    it('debe retornar 401 sin token de autenticación', async () => {
      await request(app)
        .get('/api/v1/admin/newsletter/subscribers')
        .expect(401);
    });

    it('debe retornar 403 si el usuario no es ADMIN', async () => {
      await request(app)
        .get('/api/v1/admin/newsletter/subscribers')
        .set('Authorization', 'Bearer user-token')
        .expect(403);
    });

    it('debe retornar 200 con lista de suscriptores activos para ADMIN', async () => {
      (prisma.newsletterSubscriber.findMany as any).mockResolvedValue([
        dummySubscriber,
      ]);

      const res = await request(app)
        .get('/api/v1/admin/newsletter/subscribers')
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].email).toBe('test@example.com');
    });
  });

  describe('GET /api/v1/admin/newsletter/subscribers/export', () => {
    it('debe retornar Content-Type text/csv para format=csv', async () => {
      (prisma.newsletterSubscriber.findMany as any).mockResolvedValue([
        dummySubscriber,
      ]);

      const res = await request(app)
        .get('/api/v1/admin/newsletter/subscribers/export?format=csv')
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      expect(res.headers['content-type']).toMatch(/text\/csv/);
      expect(res.headers['content-disposition']).toMatch(
        /attachment; filename="newsletter_subscribers_/
      );
    });

    it('debe retornar Content-Type application/vnd.openxmlformats para format=excel', async () => {
      (prisma.newsletterSubscriber.findMany as any).mockResolvedValue([
        dummySubscriber,
      ]);

      const res = await request(app)
        .get('/api/v1/admin/newsletter/subscribers/export?format=excel')
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      expect(res.headers['content-type']).toMatch(
        /application\/vnd\.openxmlformats/
      );
    });

    it('debe retornar 401 sin autenticación', async () => {
      await request(app)
        .get('/api/v1/admin/newsletter/subscribers/export')
        .expect(401);
    });
  });

  describe('Newsletter unsubscribe link en templates', () => {
    it('AbandonedCartTemplate debe contener la ruta /newsletter/unsubscribe', () => {
      const template = getAbandonedCartEmailTemplate(
        'Test User',
        [],
        'http://store',
        'test@example.com'
      );
      expect(template).toContain('newsletter/unsubscribe');
      expect(template).toContain('test%40example.com');
    });

    it('BirthdayCouponTemplate debe contener la ruta /newsletter/unsubscribe', () => {
      const template = getBirthdayCouponTemplate(
        'Test User',
        'BDAY-123',
        'http://store',
        'test@example.com'
      );
      expect(template).toContain('newsletter/unsubscribe');
      expect(template).toContain('test%40example.com');
    });

    it('NPSSurveyTemplate debe contener la ruta /newsletter/unsubscribe', () => {
      const template = getNPSSurveyTemplate(
        'Test User',
        'http://survey',
        'test@example.com'
      );
      expect(template).toContain('newsletter/unsubscribe');
      expect(template).toContain('test%40example.com');
    });
  });
});
