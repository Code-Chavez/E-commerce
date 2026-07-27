import { IBrandConfigRepository } from '@domain/repositories/IBrandConfigRepository';
import { BrandConfig, DEFAULT_BRAND_CONFIG } from '@domain/entities/BrandConfig';

export class GetBrandConfigUseCase {
  constructor(private readonly brandConfigRepository: IBrandConfigRepository) {}

  async execute(): Promise<BrandConfig> {
    const config = await this.brandConfigRepository.find();
    return config || DEFAULT_BRAND_CONFIG;
  }
}
