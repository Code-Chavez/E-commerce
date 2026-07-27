import { BlogPost } from '../entities/BlogPost';

export interface IBlogPostRepository {
  findById(id: number): Promise<BlogPost | null>;
  findBySlug(slug: string): Promise<BlogPost | null>;
  findAll(): Promise<BlogPost[]>;
  create(data: {
    title: string;
    slug: string;
    content: string;
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    metaTitle?: string | null;
    metaDescription?: string | null;
    tags?: any | null;
    publishedAt?: Date | null;
    authorId: number;
  }): Promise<BlogPost>;
  update(
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
  ): Promise<BlogPost>;
  delete(id: number): Promise<void>;
  incrementViews(id: number): Promise<void>;
}
