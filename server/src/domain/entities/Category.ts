export interface Category {
  id: number;
  name: string;
  parentId: number | null;
  isActive: boolean;
  imageUrl?: string | null;
  sizeGuideUrl: string | null;
  children?: Category[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryDTO {
  name: string;
  parentId?: number | null;
  sizeGuideUrl?: string | null;
}
