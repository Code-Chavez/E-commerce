import prisma from '@infrastructure/database/prisma';
import { IInventoryAuditRepository, CreateInventoryAuditDTO } from '@domain/repositories/IInventoryAuditRepository';
import { InventoryAudit } from '@domain/entities/InventoryAudit';

export class PrismaInventoryAuditRepository implements IInventoryAuditRepository {
  async create(data: CreateInventoryAuditDTO): Promise<InventoryAudit> {
    const record = await prisma.$transaction(async (tx) => {
      // 1. Crear el cabecero de la auditoría y sus detalles
      const audit = await tx.inventoryAudit.create({
        data: {
          branchId: data.branchId,
          status: data.status,
          items: {
            create: data.items.map((item) => ({
              variantId: item.variantId,
              physicalQty: item.physicalQty,
              systemQty: item.systemQty,
              difference: item.difference,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // 2. Si se confirma la auditoría, aplicar los ajustes en BranchStock y KardexEntry
      if (data.status === 'CONFIRMED') {
        for (const item of data.items) {
          if (item.difference !== 0) {
            // Obtener el último asiento del kardex para calcular costos promedio
            const lastKardex = await tx.kardexEntry.findFirst({
              where: { variantId: item.variantId, branchId: data.branchId },
              orderBy: { createdAt: 'desc' },
            });

            const unitCost = lastKardex?.unitCost ?? 0;
            const prevBalanceCost = lastKardex?.balanceCost ?? 0;

            // Sincronizar BranchStock
            await tx.branchStock.upsert({
              where: { variantId_branchId_status: { variantId: item.variantId, branchId: data.branchId, status: 'AVAILABLE' } },
              create: { variantId: item.variantId, branchId: data.branchId, quantity: item.physicalQty, status: 'AVAILABLE' },
              update: { quantity: item.physicalQty },
            });

            // Generar asiento AJUSTE en Kardex
            await tx.kardexEntry.create({
              data: {
                variantId: item.variantId,
                branchId: data.branchId,
                type: 'AJUSTE',
                quantity: Math.abs(item.difference),
                unitCost,
                balanceQty: item.physicalQty,
                balanceCost: prevBalanceCost + item.difference * unitCost,
              },
            });
          } else {
            // Si la diferencia es 0, simplemente asegurarse de que BranchStock esté registrado
            await tx.branchStock.upsert({
              where: { variantId_branchId_status: { variantId: item.variantId, branchId: data.branchId, status: 'AVAILABLE' } },
              create: { variantId: item.variantId, branchId: data.branchId, quantity: item.physicalQty, status: 'AVAILABLE' },
              update: { quantity: item.physicalQty },
            });
          }
        }
      }

      return audit;
    });

    return this.toDomain(record);
  }

  async findById(id: number): Promise<InventoryAudit | null> {
    const record = await prisma.inventoryAudit.findUnique({
      where: { id },
      include: { items: true },
    });
    return record ? this.toDomain(record) : null;
  }

  async findAllByBranch(branchId: number): Promise<InventoryAudit[]> {
    const records = await prisma.inventoryAudit.findMany({
      where: { branchId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.toDomain(r));
  }

  private toDomain(record: any): InventoryAudit {
    return {
      id: record.id,
      branchId: record.branchId,
      status: record.status as any,
      items: record.items.map((item: any) => ({
        id: item.id,
        auditId: item.auditId,
        variantId: item.variantId,
        physicalQty: item.physicalQty,
        systemQty: item.systemQty,
        difference: item.difference,
      })),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
