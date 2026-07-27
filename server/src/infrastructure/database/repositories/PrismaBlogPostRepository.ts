import prisma from '@infrastructure/database/prisma';
import { BlogPost } from '@domain/entities/BlogPost';
import { IBlogPostRepository } from '@domain/repositories/IBlogPostRepository';

export class PrismaBlogPostRepository implements IBlogPostRepository {
  async findById(id: number): Promise<BlogPost | null> {
    return prisma.blogPost.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            name: true,
          },
        },
      },
    }) as Promise<BlogPost | null>;
  }

  async findBySlug(slug: string): Promise<BlogPost | null> {
    return prisma.blogPost.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            name: true,
          },
        },
      },
    }) as Promise<BlogPost | null>;
  }

  async findAll(): Promise<BlogPost[]> {
    return prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            name: true,
          },
        },
      },
    }) as Promise<BlogPost[]>;
  }

  async create(data: {
    title: string;
    slug: string;
    content: string;
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    metaTitle?: string | null;
    metaDescription?: string | null;
    tags?: any | null;
    publishedAt?: Date | null;
    authorId: number;
  }): Promise<BlogPost> {
    return prisma.blogPost.create({
      data: data as any,
      include: {
        author: {
          select: {
            name: true,
          },
        },
      },
    }) as Promise<BlogPost>;
  }

  async update(
    id: number,
    data: Partial<{
      title: string;
      slug: string;
      content: string;
      status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
      metaTitle: string | null;
      metaDescription: string | null;
      tags: any | null;
      publishedAt: Date | null;
      authorId: number;
    }>
  ): Promise<BlogPost> {
    return prisma.blogPost.update({
      where: { id },
      data: data as any,
      include: {
        author: {
          select: {
            name: true,
          },
        },
      },
    }) as Promise<BlogPost>;
  }

  async delete(id: number): Promise<void> {
    await prisma.blogPost.delete({
      where: { id },
    });
  }

  async incrementViews(id: number): Promise<void> {
    await prisma.blogPost.update({
      where: { id },
      data: {
        views: {
          increment: 1,
        },
      },
    });
  }
}
