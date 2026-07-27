import { IProductVariantRepository } from '@domain/repositories/IProductVariantRepository';
import {
  UpdateVariantRequestDTO,
  VariantResponseDTO,
} from '../../dtos/ProductVariantDTOs';
import { ProductVariant } from '@domain/entities/ProductVariant';

import { IAuditService, AuditAction } from '@domain/services/AuditService';
import { IPriceHistoryRepository } from '@domain/repositories/IPriceHistoryRepository';
import { PrismaPriceHistoryRepository } from '@infrastructure/database/repositories/PrismaPriceHistoryRepository';

/**
 * UpdateVariantUseCase — T-078
 *
 * Permite editar el precio y/o SKU de una variante individual.
 * Valida unicidad de SKU en Prisma antes de guardar para evitar colisiones.
 */
export class UpdateVariantUseCase {
  constructor(
    private readonly variantRepository: IProductVariantRepository,
    private readonly auditService?: IAuditService,
    private readonly priceHistoryRepository?: IPriceHistoryRepository
  ) {}

  async execute(
    id: number,
    dto: UpdateVariantRequestDTO,
    userId?: number
  ): Promise<VariantResponseDTO> {
    // 1. Verificar que la variante existe
    const variant = await this.variantRepository.findById(id);
    if (!variant) {
      throw new Error('La variante no existe');
    }

    // 2. Si se quiere cambiar el SKU, verificar que no esté en uso por otra variante
    if (dto.sku && dto.sku !== variant.sku) {
      // Normalizar SKU: mayúsculas y sin espacios
      dto.sku = dto.sku.toUpperCase().trim();
      const existing = await this.variantRepository.findBySku(dto.sku);
      if (existing && existing.id !== id) {
        throw new Error(`El SKU "${dto.sku}" ya está asignado a otra variante`);
      }
    }

    // 3. Validar precios si se proporcionan
    if (dto.price !== undefined && dto.price <= 0) {
      throw new Error('El precio de venta debe ser mayor a 0');
    }
    if (dto.costPrice !== undefined && dto.costPrice < 0) {
      throw new Error('El precio de costo no puede ser negativo');
    }

    // El costo no puede superar al precio de venta resultante (margen negativo)
    const resultingPrice = dto.price ?? Number(variant.price);
    const resultingCost = dto.costPrice ?? Number(variant.costPrice ?? 0);
    if (resultingCost > resultingPrice) {
      throw new Error(
        `El precio de costo (S/ ${resultingCost.toFixed(2)}) no puede ser mayor al precio de venta (S/ ${resultingPrice.toFixed(2)})`
      );
    }

    const updated = await this.variantRepository.update(id, dto);

    const priceHistoryRepo =
      this.priceHistoryRepository || new PrismaPriceHistoryRepository();

    // 4. Registrar auditoría e historial si el precio de venta cambió
    if (
      dto.price !== undefined &&
      Number(variant.price) !== Number(dto.price)
    ) {
      if (this.auditService) {
        await this.auditService.record({
          action: AuditAction.UPDATE_PRICE,
          module: 'PRODUCTS',
          userId: userId,
          details: {
            variantId: updated.id,
            productId: updated.productId,
            priceType: 'SALE',
            oldPrice: Number(variant.price),
            newPrice: Number(updated.price),
          },
        });
      }

      await priceHistoryRepo.create({
        variantId: updated.id,
        userId: userId ?? null,
        priceType: 'SALE',
        oldPrice: Number(variant.price),
        newPrice: Number(updated.price),
      });
    }

    // 5. Registrar auditoría e historial si el precio de costo cambió
    if (
      dto.costPrice !== undefined &&
      Number(variant.costPrice ?? 0) !== Number(dto.costPrice)
    ) {
      if (this.auditService) {
        await this.auditService.record({
          action: AuditAction.UPDATE_PRICE,
          module: 'PRODUCTS',
          userId: userId,
          details: {
            variantId: updated.id,
            productId: updated.productId,
            priceType: 'COST',
            oldPrice: Number(variant.costPrice ?? 0),
            newPrice: Number(updated.costPrice),
          },
        });
      }

      await priceHistoryRepo.create({
        variantId: updated.id,
        userId: userId ?? null,
        priceType: 'COST',
        oldPrice: Number(variant.costPrice ?? 0),
        newPrice: Number(updated.costPrice),
      });
    }

    return this.mapToDTO(updated);
  }

  private mapToDTO(variant: ProductVariant): VariantResponseDTO {
    return {
      id: variant.id,
      productId: variant.productId,
      sku: variant.sku,
      price: variant.price,
      costPrice: variant.costPrice,
      attributesJson: variant.attributesJson,
      isActive: variant.isActive,
      minStock: variant.minStock,
      discountPercent: variant.discountPercent,
      createdAt: variant.createdAt,
      updatedAt: variant.updatedAt,
    };
  }
}
