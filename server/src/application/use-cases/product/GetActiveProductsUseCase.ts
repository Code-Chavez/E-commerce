import { IProductRepository } from '@domain/repositories/IProductVariantRepository';
import { Product } from '@domain/entities/Product';

export class GetActiveProductsUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(): Promise<Product[]> {
    return this.productRepository.findAllActive();
  }
}
