import { IProductRepository } from '@domain/repositories/IProductVariantRepository';
import { Product } from '@domain/entities/Product';

export class ToggleProductStatusUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(productId: number, isActive: boolean): Promise<Product> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new Error(`El producto con ID ${productId} no existe`);
    }
    return this.productRepository.updateStatus(productId, isActive);
  }
}
