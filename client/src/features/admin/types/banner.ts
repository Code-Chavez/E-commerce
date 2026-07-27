export interface Banner {
  id: number;
  imageUrl: string;
  linkUrl: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBannerPayload {
  linkUrl?: string;
  order?: number;
  image: File;
}

export interface UpdateBannerPayload {
  linkUrl?: string;
  order?: number;
  isActive?: boolean;
  image?: File;
}

export interface ReorderPayload {
  orders: { id: number; order: number }[];
}
