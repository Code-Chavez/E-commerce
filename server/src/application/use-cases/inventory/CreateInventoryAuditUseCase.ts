import { IInventoryAuditRepository } from '@domain/repositories/IInventoryAuditRepository';
import { CreateInventoryAuditRequestDTO, InventoryAuditResponseDTO } from '../../dtos/InventoryAuditDTOs';
import prisma from '@infrastructure/database/prisma';

export class CreateInventoryAuditUseCase {
  constructor(private readonly inventoryAuditRepository: IInventoryAuditRepository) {}

  async execute(dto: CreateInventoryAuditRequestDTO): Promise<InventoryAuditResponseDTO> {
    // 1. Validar que la sucursal exista
    const branch = await prisma.branch.findUnique({ where: { id: dto.branchId } });
    if (!branch) {
      throw new Error(`La sucursal con ID ${dto.branchId} no existe`);
    }

    // 2. Procesar ítems y calcular systemQty e indicativo de diferencia
    const itemsWithQty = [];
    for (const item of dto.items) {
      // Validar que la variante exista
      const variant = await prisma.productVariant.findUnique({ where: { id: item.variantId } });
      if (!variant) {
        throw new Error(`La variante de producto con ID ${item.variantId} no existe`);
      }

      // Obtener el stock actual de la sucursal
      const stock = await prisma.branchStock.findUnique({
        where: { variantId_branchId_status: { variantId: item.variantId, branchId: dto.branchId, status: 'AVAILABLE' } },
      });

      const systemQty = stock?.quantity ?? 0;
      const difference = item.physicalQty - systemQty;

      itemsWithQty.push({
        variantId: item.variantId,
        physicalQty: item.physicalQty,
        systemQty,
        difference,
      });
    }

    // 3. Persistir en el repositorio
    const audit = await this.inventoryAuditRepository.create({
      branchId: dto.branchId,
      status: dto.status,
      items: itemsWithQty,
    });

    return {
      id: audit.id!,
      branchId: audit.branchId,
      status: audit.status,
      items: audit.items.map((item) => ({
        id: item.id,
        variantId: item.variantId,
        physicalQty: item.physicalQty,
        systemQty: item.systemQty,
        difference: item.difference,
      })),
      createdAt: audit.createdAt!,
      updatedAt: audit.updatedAt!,
    };
  }
}
