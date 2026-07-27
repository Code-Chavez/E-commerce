import { IProductVariantRepository, VariantSearchResult } from '@domain/repositories/IProductVariantRepository';

export class SearchVariantsUseCase {
  constructor(private readonly productVariantRepository: IProductVariantRepository) {}

  async execute(query: string, limit: number): Promise<VariantSearchResult[]> {
    if (!query || query.trim() === '') {
      return [];
    }
    return this.productVariantRepository.search(query.trim(), limit);
  }
}
