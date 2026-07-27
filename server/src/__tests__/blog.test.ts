import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../app';

// Mock Prisma
jest.mock('@infrastructure/database/prisma', () => {
  const mockBlogPost = {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const mockUser = {
    findUnique: jest.fn(),
  };

  const mockPrisma: any = {
    blogPost: mockBlogPost,
    user: mockUser,
    $transaction: jest.fn().mockImplementation(async (cb: any): Promise<any> => cb(mockPrisma)),
  };

  return { __esModule: true, default: mockPrisma };
});

// Mock JwtService
jest.mock('@infrastructure/services/JwtService', () => ({
  JwtService: jest.fn().mockImplementation(() => ({
    verifyAccessToken: jest.fn().mockReturnValue({
      userId: 1,
      email: 'admin@e-commerce.com',
      role: 'ADMIN',
    }),
  })),
}));

import prisma from '@infrastructure/database/prisma';

const dummyAdmin = {
  id: 1,
  email: 'admin@e-commerce.com',
  isActive: true,
  roles: [
    {
      name: 'ADMIN',
      permissions: [{ name: 'roles:manage' }],
    },
  ],
};

const dummyBlogPost = {
  id: 1,
  title: 'Mi Primer Post',
  slug: 'mi-primer-post',
  content: 'Contenido del post',
  status: 'DRAFT',
  metaTitle: 'SEO Title',
  metaDescription: 'SEO Desc',
  tags: ['seo', 'test'],
  publishedAt: null,
  views: 0,
  authorId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Tests de Integración — HU-018: Creación y Publicación de Artículos de Blog con SEO (T-179)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.user.findUnique as any).mockResolvedValue(dummyAdmin);
  });

  describe('GET /api/v1/admin/blog', () => {
    it('debe retornar todos los artículos de blog', async () => {
      (prisma.blogPost.findMany as any).mockResolvedValue([dummyBlogPost]);

      const res = await request(app)
        .get('/api/v1/admin/blog')
        .set('Authorization', 'Bearer mock-token')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe('Mi Primer Post');
      expect(prisma.blogPost.findMany).toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/admin/blog/:id', () => {
    it('debe retornar un artículo por su ID', async () => {
      (prisma.blogPost.findUnique as any).mockResolvedValue(dummyBlogPost);

      const res = await request(app)
        .get('/api/v1/admin/blog/1')
        .set('Authorization', 'Bearer mock-token')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(1);
      expect(prisma.blogPost.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } })
      );
    });
  });

  describe('POST /api/v1/admin/blog', () => {
    it('debe crear un artículo de blog y generar el slug único', async () => {
      (prisma.blogPost.findUnique as any).mockResolvedValue(null); // No collision
      (prisma.blogPost.create as any).mockResolvedValue(dummyBlogPost);

      const res = await request(app)
        .post('/api/v1/admin/blog')
        .set('Authorization', 'Bearer mock-token')
        .send({
          title: 'Mi Primer Post',
          content: 'Contenido del post',
          metaTitle: 'SEO Title',
          metaDescription: 'SEO Desc',
          tags: ['seo'],
          publishedAt: new Date().toISOString(),
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Mi Primer Post');
      expect(prisma.blogPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Mi Primer Post',
            slug: 'mi-primer-post',
            content: 'Contenido del post',
            tags: ['seo'],
            publishedAt: expect.any(Date),
          }),
        })
      );
    });

    it('debe resolver la colisión del slug añadiendo un sufijo numérico', async () => {
      // First slug check returns existing post, second check returns null
      (prisma.blogPost.findUnique as any)
        .mockResolvedValueOnce({ id: 2 }) // collision on 'mi-primer-post'
        .mockResolvedValueOnce(null); // no collision on 'mi-primer-post-1'
      
      (prisma.blogPost.create as any).mockResolvedValue({
        ...dummyBlogPost,
        slug: 'mi-primer-post-1',
      });

      const res = await request(app)
        .post('/api/v1/admin/blog')
        .set('Authorization', 'Bearer mock-token')
        .send({
          title: 'Mi Primer Post',
          content: 'Contenido del post',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe('mi-primer-post-1');
    });

    it('debe retornar 400 si falta el título', async () => {
      const res = await request(app)
        .post('/api/v1/admin/blog')
        .set('Authorization', 'Bearer mock-token')
        .send({
          content: 'Contenido sin título',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/admin/blog/:id', () => {
    it('debe actualizar un artículo de blog correctamente', async () => {
      (prisma.blogPost.findUnique as any).mockResolvedValue(dummyBlogPost);
      (prisma.blogPost.update as any).mockResolvedValue({
        ...dummyBlogPost,
        title: 'Título Editado',
        slug: 'titulo-editado',
      });

      const res = await request(app)
        .patch('/api/v1/admin/blog/1')
        .set('Authorization', 'Bearer mock-token')
        .send({
          title: 'Título Editado',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Título Editado');
      expect(res.body.data.slug).toBe('titulo-editado');
    });
  });

  describe('DELETE /api/v1/admin/blog/:id', () => {
    it('debe eliminar lógicamente un artículo de blog cambiando su estado a ARCHIVED', async () => {
      (prisma.blogPost.findUnique as any).mockResolvedValue(dummyBlogPost);
      (prisma.blogPost.update as any).mockResolvedValue({ ...dummyBlogPost, status: 'ARCHIVED' });

      const res = await request(app)
        .delete('/api/v1/admin/blog/1')
        .set('Authorization', 'Bearer mock-token')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('exitosamente');
      expect(prisma.blogPost.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 }, data: { status: 'ARCHIVED' } })
      );
    });
  });

  describe('GET /api/v1/blog', () => {
    it('debe retornar únicamente los artículos publicados cuya fecha no sea futura', async () => {
      const dummyPublished = { ...dummyBlogPost, status: 'PUBLISHED', views: 5, publishedAt: new Date(Date.now() - 10000) };
      const dummyFuture = { ...dummyBlogPost, id: 4, status: 'PUBLISHED', publishedAt: new Date(Date.now() + 100000) };
      (prisma.blogPost.findMany as any).mockResolvedValue([dummyPublished, { ...dummyBlogPost, id: 3, status: 'DRAFT' }, dummyFuture]);

      const res = await request(app)
        .get('/api/v1/blog')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(1);
      expect(res.body.data[0].status).toBe('PUBLISHED');
    });
  });

  describe('GET /api/v1/blog/:slug', () => {
    it('debe retornar el artículo, incrementar vistas de forma atómica y devolver el contador sumado', async () => {
      const dummyPublished = { ...dummyBlogPost, status: 'PUBLISHED', views: 5 };
      (prisma.blogPost.findUnique as any).mockResolvedValue(dummyPublished);
      (prisma.blogPost.update as any).mockResolvedValue(dummyPublished);

      const res = await request(app)
        .get('/api/v1/blog/mi-primer-post')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(1);
      expect(res.body.data.views).toBe(6); // views 5 + 1 locally incremented

      expect(prisma.blogPost.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: {
            views: {
              increment: 1
            }
          }
        })
      );
    });

    it('debe retornar 404 si el artículo no existe, es un borrador o está programado en el futuro', async () => {
      (prisma.blogPost.findUnique as any).mockResolvedValue(null);

      await request(app)
        .get('/api/v1/blog/non-existent')
        .expect(404);

      (prisma.blogPost.findUnique as any).mockResolvedValue({ ...dummyBlogPost, status: 'DRAFT' });

      await request(app)
        .get('/api/v1/blog/draft-post')
        .expect(404);

      (prisma.blogPost.findUnique as any).mockResolvedValue({ ...dummyBlogPost, status: 'PUBLISHED', publishedAt: new Date(Date.now() + 100000) });

      await request(app)
        .get('/api/v1/blog/future-post')
        .expect(404);
    });
  });
});


