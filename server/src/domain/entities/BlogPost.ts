export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  status: PostStatus;
  metaTitle: string | null;
  metaDescription: string | null;
  tags: any | null;
  publishedAt: Date | null;
  views: number;
  authorId: number;
  createdAt: Date;
  updatedAt: Date;
  author?: {
    name: string;
  };
}
