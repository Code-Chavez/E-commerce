// ─── HU-051 T-091: Implementación Prisma del repositorio de Ingreso de Mercadería ──

import prisma from '@infrastructure/database/prisma';
import { requestContext } from '@infrastructure/context/RequestContext';
import {
  IStockEntryRepository,
  CreateStockEntryDTO,
} from '@domain/repositories/IStockEntryRepository';
import { StockEntry, StockEntryItem } from '@domain/entities/StockEntry';
import {
  StockEntry as PrismaStockEntry,
  StockEntryItem as PrismaStockEntryItem,
  Supplier as PrismaSupplier,
} from '@prisma/client';

type StockEntryWithRelations = PrismaStockEntry & {
  supplier: PrismaSupplier;
  items: PrismaStockEntryItem[];
};

export class PrismaStockEntryRepository implements IStockEntryRepository {
  /**
   * Registra el ingreso de mercadería en una transacción atómica:
   *  1. Crea el registro StockEntry con sus items
   *  2. Actualiza (upsert) el BranchStock por variante
   *  3. Genera el asiento ENTRADA en el Kardex
   */
  async create(data: CreateStockEntryDTO): Promise<StockEntry> {
    const record = await prisma.$transaction(async (tx) => {
      // 1. Crear cabecera y detalle del ingreso
      const stockEntry = await tx.stockEntry.create({
        data: {
          supplierId: data.supplierId,
          invoiceNumber: data.invoiceNumber,
          branchId: data.branchId,
          items: {
            create: data.items.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              unitCost: item.unitCost,
            })),
          },
        },
        include: {
          supplier: true,
          items: true,
        },
      });

      // 2. Actualizar el precio de costo de cada variante al último costo de compra
      //    y registrar el cambio en el historial de precios (tipo COST)
      for (const item of data.items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          select: { costPrice: true },
        });

        const currentCost = Number(variant?.costPrice ?? 0);
        if (variant && currentCost !== item.unitCost) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { costPrice: item.unitCost },
          });

          await tx.priceHistory.create({
            data: {
              variantId: item.variantId,
              userId: requestContext.getStore()?.userId ?? null,
              priceType: 'COST',
              oldPrice: currentCost,
              newPrice: item.unitCost,
            },
          });
        }
      }

      // 3. Por cada ítem: actualizar BranchStock y generar asiento Kardex (soportando distribución de sucursales)
      for (const item of data.items) {
        // Encontrar distribuciones especificadas para este variantId
        const dists = (data.distributionItems || []).filter(
          (d) => d.variantId === item.variantId
        );

        const totalDistributed = dists.reduce((sum, d) => sum + d.quantity, 0);

        if (totalDistributed > item.quantity) {
          throw new Error(
            `La suma de cantidades a distribuir para la variante ${item.variantId} (${totalDistributed}) supera la cantidad total ingresada (${item.quantity})`
          );
        }

        const remainingQuantity = item.quantity - totalDistributed;

        // Agrupar cantidades a asignar por branchId
        const groupedAssignments: Record<number, number> = {};

        for (const dist of dists) {
          groupedAssignments[dist.branchId] = (groupedAssignments[dist.branchId] || 0) + dist.quantity;
        }

        if (remainingQuantity > 0) {
          groupedAssignments[data.branchId] = (groupedAssignments[data.branchId] || 0) + remainingQuantity;
        }

        // Procesar transacciones individuales para cada sucursal de destino
        for (const [branchIdStr, qty] of Object.entries(groupedAssignments)) {
          const targetBranchId = parseInt(branchIdStr, 10);

          // Obtener el último asiento del kardex para esa sucursal y variante
          const lastKardex = await tx.kardexEntry.findFirst({
            where: { variantId: item.variantId, branchId: targetBranchId },
            orderBy: { createdAt: 'desc' },
          });

          const prevBalanceQty = lastKardex?.balanceQty ?? 0;
          const prevBalanceCost = lastKardex?.balanceCost ?? 0;
          const newBalanceQty = prevBalanceQty + qty;
          const newBalanceCost = prevBalanceCost + qty * item.unitCost;

          // Upsert del stock en la sucursal de asignación
          await tx.branchStock.upsert({
            where: { variantId_branchId_status: { variantId: item.variantId, branchId: targetBranchId, status: 'AVAILABLE' } },
            create: { variantId: item.variantId, branchId: targetBranchId, quantity: qty, status: 'AVAILABLE' },
            update: { quantity: { increment: qty } },
          });

          // Asiento COMPRA en Kardex para la sucursal de asignación
          await tx.kardexEntry.create({
            data: {
              variantId: item.variantId,
              branchId: targetBranchId,
              type: 'COMPRA',
              quantity: qty,
              unitCost: item.unitCost,
              balanceQty: newBalanceQty,
              balanceCost: newBalanceCost,
              userId: requestContext.getStore()?.userId ?? null,
            },
          });
        }
      }

      return stockEntry;
    });

    return this.toDomain(record);
  }

  async findById(id: number): Promise<StockEntry | null> {
    const record = await prisma.stockEntry.findUnique({
      where: { id },
      include: { supplier: true, items: true },
    });
    return record ? this.toDomain(record) : null;
  }

  async findAll(): Promise<StockEntry[]> {
    const records = await prisma.stockEntry.findMany({
      include: { supplier: true, items: true },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.toDomain(r));
  }

  private toDomain(record: StockEntryWithRelations): StockEntry {
    return {
      id: record.id,
      supplierId: record.supplierId,
      invoiceNumber: record.invoiceNumber,
      branchId: record.branchId,
      supplier: {
        id: record.supplier.id,
        ruc: record.supplier.ruc,
        razonSocial: record.supplier.razonSocial,
        contacto: record.supplier.contacto,
        rubro: record.supplier.rubro,
        direccion: record.supplier.direccion,
        isActive: record.supplier.isActive,
        createdAt: record.supplier.createdAt,
        updatedAt: record.supplier.updatedAt,
      },
      items: record.items.map((item): StockEntryItem => ({
        id: item.id,
        stockEntryId: item.stockEntryId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitCost: item.unitCost,
      })),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
