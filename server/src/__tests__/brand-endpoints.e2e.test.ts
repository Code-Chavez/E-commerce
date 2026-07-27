import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';

// Mock JWT verification
var mockVerifyAccessToken = jest.fn();
jest.mock('@infrastructure/services/JwtService', () => ({
  JwtService: jest.fn().mockImplementation(() => ({
    verifyAccessToken: (...args: any[]) => mockVerifyAccessToken(...args),
  })),
}));

// Mock Prisma
jest.mock('@infrastructure/database/prisma', () => ({
  __esModule: true,
  default: {
    brandConfig: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock Email Service
jest.mock('@infrastructure/services/ResendEmailService', () => ({
  ResendEmailService: jest.fn().mockImplementation(() => ({
    sendEmail: jest.fn(),
  })),
}));

import app from '../app';
import prisma from '@infrastructure/database/prisma';

describe('Branding Endpoints (E2E)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/config/brand', () => {
    it('debería retornar los valores por defecto del dominio cuando no hay configuración en BD', async () => {
      (prisma.brandConfig.findUnique as any).mockResolvedValue(null);

      const res = await request(app).get('/api/v1/config/brand');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.brandName).toBe("E-Commerce");
      expect(res.body.data.colorBrandPrimary).toBe('#D9D9D2');
      expect(prisma.brandConfig.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('debería retornar la configuración de la base de datos cuando exista', async () => {
      const mockConfig = {
        id: 1,
        brandName: 'Mi Marca Especial',
        logoHorizontalUrl: 'https://logo.com/img.png',
        colorBrandPrimary: '#123456',
        socialLinksJson: { facebook: 'fb.com' },
        updatedAt: new Date(),
      };
      (prisma.brandConfig.findUnique as any).mockResolvedValue(mockConfig);

      const res = await request(app).get('/api/v1/config/brand');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.brandName).toBe('Mi Marca Especial');
      expect(res.body.data.colorBrandPrimary).toBe('#123456');
    });
  });

  describe('PUT /api/v1/config/brand', () => {
    it('debería retornar 401 si no se provee token de autorización', async () => {
      const res = await request(app)
        .put('/api/v1/config/brand')
        .send({
          brandName: 'Nueva Marca',
          colorBrandPrimary: '#999999',
          colorBrandBg: '#F7F7F5',
          colorBrandText: '#6B6B6B',
          colorBrandAccent: '#3F3F3F',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('debería retornar 403 si el usuario no tiene el permiso necesario (roles:manage)', async () => {
      // Mock del token de acceso sin el rol administrativo necesario
      mockVerifyAccessToken.mockReturnValue({
        userId: 42,
        email: 'seller@test.com',
        role: 'SELLER',
      });
      // Mock dbUser que no posee el permiso 'roles:manage'
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 42,
        email: 'seller@test.com',
        isActive: true,
        roles: [
          {
            name: 'SELLER',
            permissions: [{ name: 'products:read' }],
          },
        ],
      });

      const res = await request(app)
        .put('/api/v1/config/brand')
        .set('Authorization', 'Bearer dummy_token')
        .send({
          brandName: 'Nueva Marca',
          colorBrandPrimary: '#999999',
          colorBrandBg: '#F7F7F5',
          colorBrandText: '#6B6B6B',
          colorBrandAccent: '#3F3F3F',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('roles:manage');
    });

    it('debería actualizar la configuración y registrar correctamente en auditoría el userId del admin (req.auth)', async () => {
      const adminUserId = 99;
      // Mock token con privilegios
      mockVerifyAccessToken.mockReturnValue({
        userId: adminUserId,
        email: 'admin@test.com',
        role: 'ADMIN',
      });
      // Mock dbUser con permiso 'roles:manage'
      (prisma.user.findUnique as any).mockResolvedValue({
        id: adminUserId,
        email: 'admin@test.com',
        isActive: true,
        roles: [
          {
            name: 'ADMIN',
            permissions: [{ name: 'roles:manage' }],
          },
        ],
      });

      const updatedConfig = {
        id: 1,
        brandName: 'Marca Admin',
        logoHorizontalUrl: 'https://logo.com/new.png',
        colorBrandPrimary: '#00ff00',
        socialLinksJson: { twitter: 'twitter.com' },
        updatedAt: new Date(),
      };
      (prisma.brandConfig.upsert as any).mockResolvedValue(updatedConfig);
      (prisma.auditLog.create as any).mockResolvedValue({ id: 100 });


      const res = await request(app)
        .put('/api/v1/config/brand')
        .set('Authorization', 'Bearer admin_token')
        .send({
          brandName: 'Marca Admin',
          logoHorizontalUrl: 'https://logo.com/new.png',
          colorBrandPrimary: '#00ff00',
          colorBrandBg: '#F7F7F5',
          colorBrandText: '#6B6B6B',
          colorBrandAccent: '#3F3F3F',
          socialLinksJson: { twitter: 'twitter.com' },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.brandName).toBe('Marca Admin');

      // Verificar que el repositorio persistió los datos en la base de datos
      expect(prisma.brandConfig.upsert).toHaveBeenCalledWith({
        where: { id: 1 },
        update: expect.objectContaining({
          brandName: 'Marca Admin',
          colorBrandPrimary: '#00ff00',
          colorBrandBg: '#F7F7F5',
          colorBrandText: '#6B6B6B',
          colorBrandAccent: '#3F3F3F',
        }),
        create: expect.objectContaining({
          brandName: 'Marca Admin',
          colorBrandPrimary: '#00ff00',
          colorBrandBg: '#F7F7F5',
          colorBrandText: '#6B6B6B',
          colorBrandAccent: '#3F3F3F',
        }),
      });

      // Verificar trazabilidad de auditoría en req.auth (C-04): userId del admin registrado con éxito
      expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'UPDATE_BRAND_CONFIG',
          module: 'SYSTEM_CONFIG',
          userId: adminUserId,
        }),
      });
    });
  });
});


