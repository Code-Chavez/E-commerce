export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  status: PostStatus;
  metaTitle: string | null;
  metaDescription: string | null;
  views?: number;
  authorId: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  tags?: string[];
  author?: {
    name: string;
  };
}
