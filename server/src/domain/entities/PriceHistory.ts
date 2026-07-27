export interface PriceHistoryUser {
  id: number;
  name: string | null;
  email: string;
}

export type PriceType = 'SALE' | 'COST';

export interface PriceHistory {
  id: number;
  variantId: number;
  userId: number | null;
  user?: PriceHistoryUser | null;
  priceType: PriceType;
  oldPrice: number;
  newPrice: number;
  createdAt: Date;
}

export interface CreatePriceHistoryDTO {
  variantId: number;
  userId: number | null;
  priceType?: PriceType;
  oldPrice: number;
  newPrice: number;
}
