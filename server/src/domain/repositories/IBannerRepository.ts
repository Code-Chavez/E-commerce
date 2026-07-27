import { Banner } from '../entities/Banner';

export interface CreateBannerDTO {
  imageUrl: string;
  linkUrl?: string | null;
  order?: number;
}

export interface UpdateBannerDTO {
  imageUrl?: string;
  linkUrl?: string | null;
  order?: number;
  isActive?: boolean;
}

export interface IBannerRepository {
  findById(id: number): Promise<Banner | null>;
  findAll(): Promise<Banner[]>;
  findAllActiveOrdered(): Promise<Banner[]>;
  create(data: CreateBannerDTO): Promise<Banner>;
  update(id: number, data: UpdateBannerDTO): Promise<Banner>;
  delete(id: number): Promise<void>;
  updateOrder(id: number, order: number): Promise<void>;
}
