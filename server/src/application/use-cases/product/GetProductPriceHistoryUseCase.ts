import { IPriceHistoryRepository } from '@domain/repositories/IPriceHistoryRepository';
import { PriceHistory } from '@domain/entities/PriceHistory';
import { PrismaPriceHistoryRepository } from '@infrastructure/database/repositories/PrismaPriceHistoryRepository';

export class GetProductPriceHistoryUseCase {
  constructor(private readonly priceHistoryRepository?: IPriceHistoryRepository) {}

  async execute(productId: number): Promise<PriceHistory[]> {
    const repo = this.priceHistoryRepository || new PrismaPriceHistoryRepository();
    return repo.findByProductId(productId);
  }
}
