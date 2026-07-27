// ─── HU-051 T-091: Registrar ingreso de mercadería ───────────────────────────

import { IStockEntryRepository } from '@domain/repositories/IStockEntryRepository';
import { ISupplierRepository } from '@domain/repositories/ISupplierRepository';
import { StockEntry } from '@domain/entities/StockEntry';
import { CreateStockEntryRequestDTO, StockEntryResponseDTO } from '../../dtos/StockEntryDTOs';

export class CreateStockEntryUseCase {
  constructor(
    private readonly stockEntryRepository: IStockEntryRepository,
    private readonly supplierRepository: ISupplierRepository
  ) {}

  async execute(dto: CreateStockEntryRequestDTO): Promise<StockEntryResponseDTO> {
    // Validar que el proveedor exista y esté activo
    const supplier = await this.supplierRepository.findById(dto.supplierId);
    if (!supplier) {
      throw new Error(`El proveedor con ID ${dto.supplierId} no existe`);
    }
    if (!supplier.isActive) {
      throw new Error(`El proveedor '${supplier.razonSocial}' se encuentra inactivo`);
    }

    // Validar regla de negocio de distribución (HU-022 / RF-37)
    if (dto.distributionItems && dto.distributionItems.length > 0) {
      const entryQuantities: Record<number, number> = {};
      
      // Sumar cantidad ingresada por variante
      for (const item of dto.items) {
        entryQuantities[item.variantId] = (entryQuantities[item.variantId] || 0) + item.quantity;
      }

      // Sumar distribución y comparar
      const distQuantities: Record<number, number> = {};
      for (const dist of dto.distributionItems) {
        distQuantities[dist.variantId] = (distQuantities[dist.variantId] || 0) + dist.quantity;
      }

      for (const [variantIdStr, distQty] of Object.entries(distQuantities)) {
        const variantId = Number(variantIdStr);
        const entryQty = entryQuantities[variantId] || 0;
        
        if (distQty > entryQty) {
          throw new Error(
            `DISTRIBUTION_EXCEEDS_ENTRY: La cantidad a distribuir (${distQty}) excede el total ingresado (${entryQty}) para la variante ${variantId}.`
          );
        }
      }
    }

    // Registrar el ingreso con transacción atómica en la infraestructura
    const stockEntry = await this.stockEntryRepository.create({
      supplierId: dto.supplierId,
      invoiceNumber: dto.invoiceNumber,
      branchId: dto.branchId,
      items: dto.items,
      distributionItems: dto.distributionItems,
    });

    return this.mapToDTO(stockEntry, supplier.razonSocial);
  }

  private mapToDTO(entry: StockEntry, supplierRazonSocial: string): StockEntryResponseDTO {
    return {
      id: entry.id,
      supplierId: entry.supplierId,
      supplierRazonSocial,
      invoiceNumber: entry.invoiceNumber,
      branchId: entry.branchId,
      items: entry.items.map((item) => ({
        id: item.id,
        variantId: item.variantId,
        quantity: item.quantity,
        unitCost: item.unitCost,
      })),
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }
}
