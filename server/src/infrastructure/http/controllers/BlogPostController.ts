import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaBlogPostRepository } from '@infrastructure/database/repositories/PrismaBlogPostRepository';
import {
  CreateBlogPostUseCase,
  UpdateBlogPostUseCase,
  GetBlogPostUseCase,
  ListBlogPostsUseCase,
  DeleteBlogPostUseCase,
  ListPublicBlogPostsUseCase,
  GetPublicBlogPostBySlugUseCase,
} from '@application/use-cases/blog/BlogPostUseCases';

const blogPostRepository = new PrismaBlogPostRepository();
const createBlogPostUseCase = new CreateBlogPostUseCase(blogPostRepository);
const updateBlogPostUseCase = new UpdateBlogPostUseCase(blogPostRepository);
const getBlogPostUseCase = new GetBlogPostUseCase(blogPostRepository);
const listBlogPostsUseCase = new ListBlogPostsUseCase(blogPostRepository);
const deleteBlogPostUseCase = new DeleteBlogPostUseCase(blogPostRepository);
const listPublicBlogPostsUseCase = new ListPublicBlogPostsUseCase(blogPostRepository);
const getPublicBlogPostBySlugUseCase = new GetPublicBlogPostBySlugUseCase(blogPostRepository);

const CreateBlogPostSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  content: z.string().min(1, 'El contenido es obligatorio'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  tags: z.array(z.any()).nullable().optional(),
  publishedAt: z.string().datetime({ offset: true }).or(z.date()).nullable().optional(),
});

const UpdateBlogPostSchema = CreateBlogPostSchema.partial();

export class BlogPostController {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const posts = await listBlogPostsUseCase.execute();
      return res.status(200).json({ success: true, data: posts });
    } catch (e) {
      next(e);
    }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'ID inválido' });
      }
      const post = await getBlogPostUseCase.execute(id);
      return res.status(200).json({ success: true, data: post });
    } catch (e) {
      next(e);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = CreateBlogPostSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.issues });
      }
      const authorId = req.auth?.userId;
      if (!authorId) {
        return res.status(401).json({ success: false, error: 'No autorizado' });
      }
      const post = await createBlogPostUseCase.execute(parsed.data, authorId);
      return res.status(201).json({ success: true, data: post });
    } catch (e) {
      next(e);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'ID inválido' });
      }
      const parsed = UpdateBlogPostSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.issues });
      }
      const post = await updateBlogPostUseCase.execute(id, parsed.data);
      return res.status(200).json({ success: true, data: post });
    } catch (e) {
      next(e);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'ID inválido' });
      }
      await deleteBlogPostUseCase.execute(id);
      return res.status(200).json({ success: true, message: 'Artículo eliminado exitosamente' });
    } catch (e) {
      next(e);
    }
  }

  async getPublicList(_req: Request, res: Response, next: NextFunction) {
    try {
      const posts = await listPublicBlogPostsUseCase.execute();
      return res.status(200).json({ success: true, data: posts });
    } catch (e) {
      next(e);
    }
  }

  async getPublicBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const slug = String(req.params.slug);
      const post = await getPublicBlogPostBySlugUseCase.execute(slug);
      if (!post) {
        return res.status(404).json({ success: false, error: 'El artículo no existe o no está publicado' });
      }
      return res.status(200).json({ success: true, data: post });
    } catch (e) {
      next(e);
    }
  }
}
