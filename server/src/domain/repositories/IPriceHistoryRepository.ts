import { PriceHistory, CreatePriceHistoryDTO } from '@domain/entities/PriceHistory';

export interface IPriceHistoryRepository {
  create(data: CreatePriceHistoryDTO): Promise<PriceHistory>;
  findByProductId(productId: number): Promise<PriceHistory[]>;
  findByVariantId(variantId: number): Promise<PriceHistory[]>;
}
