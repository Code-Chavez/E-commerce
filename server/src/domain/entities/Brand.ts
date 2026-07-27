export interface Brand {
  id: number;
  name: string;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBrandDTO {
  name: string;
  logoUrl?: string | null;
}
