import prisma from '@infrastructure/database/prisma';
import { requestContext } from '@infrastructure/context/RequestContext';
import { PrismaInventorySettingsRepository } from '@infrastructure/database/repositories/PrismaInventorySettingsRepository';
import { PromedioStrategy } from './strategies/PromedioStrategy';
import { PepsStrategy } from './strategies/PepsStrategy';
import type { IKardexCostStrategy } from '@domain/services/IKardexCostStrategy';

export class KardexService {
  /**
   * T-101: Calcula el Costo Promedio Ponderado (CPP) para una variante en una sucursal.
   * CPP = (stockAnterior * costoAnterior + cantidadEntrada * costoEntrada)
   *       / (stockAnterior + cantidadEntrada)
   */
  async calcularCostoPromedioPonderado(
    variantId: number,
    branchId: number,
    cantidadEntrada: number,
    costoEntrada: number
  ): Promise<number> {
    const stock = await prisma.branchStock.findUnique({
      where: { variantId_branchId_status: { variantId, branchId, status: 'AVAILABLE' } },
    });

    const lastEntry = await prisma.kardexEntry.findFirst({
      where: { variantId, branchId, type: 'COMPRA' },
      orderBy: { createdAt: 'desc' },
    });

    const stockActual = stock?.quantity ?? 0;
    const costoActual = lastEntry?.unitCost ?? 0;

    if (stockActual <= 0) return costoEntrada;

    const cpp = (stockActual * costoActual + cantidadEntrada * costoEntrada)
      / (stockActual + cantidadEntrada);

    return Math.round(cpp * 100) / 100;
  }

  /** Resuelve la estrategia activa según la configuración en BD. */
  private async resolveStrategy(): Promise<IKardexCostStrategy> {
    const settingsRepo = new PrismaInventorySettingsRepository();
    const settings = await settingsRepo.get();
    return settings.valuationMethod === 'PEPS' ? new PepsStrategy() : new PromedioStrategy();
  }

  /**
   * Registra una COMPRA con CPP recalculado (siempre CPP para entradas) y actualiza BranchStock.
   */
  async registrarEntrada(args: {
    variantId: number;
    branchId: number;
    quantity: number;
    unitCost: number;
    userId?: number;
  }): Promise<void> {
    const cpp = await this.calcularCostoPromedioPonderado(
      args.variantId,
      args.branchId,
      args.quantity,
      args.unitCost
    );

    const userId = args.userId ?? requestContext.getStore()?.userId ?? null;

    await prisma.$transaction(async tx => {
      const stock = await tx.branchStock.upsert({
        where: { variantId_branchId_status: { variantId: args.variantId, branchId: args.branchId, status: 'AVAILABLE' } },
        create: { variantId: args.variantId, branchId: args.branchId, quantity: args.quantity, status: 'AVAILABLE' },
        update: { quantity: { increment: args.quantity } },
      });

      const lastEntry = await tx.kardexEntry.findFirst({
        where: { variantId: args.variantId, branchId: args.branchId },
        orderBy: { createdAt: 'desc' },
      });

      await tx.kardexEntry.create({
        data: {
          variantId: args.variantId,
          branchId: args.branchId,
          type: 'COMPRA',
          quantity: args.quantity,
          unitCost: cpp,
          balanceQty: stock.quantity,
          balanceCost: (lastEntry?.balanceCost ?? 0) + args.quantity * cpp,
          userId,
        },
      });
    });
  }

  /**
   * Registra una VENTA usando la estrategia de costeo activa (PEPS o CPP) y actualiza BranchStock.
   */
  async registrarSalida(args: {
    variantId: number;
    branchId: number;
    quantity: number;
    userId?: number;
  }): Promise<void> {
    const userId = args.userId ?? requestContext.getStore()?.userId ?? null;

    await prisma.$transaction(async tx => {
      const stock = await tx.branchStock.findUnique({
        where: { variantId_branchId_status: { variantId: args.variantId, branchId: args.branchId, status: 'AVAILABLE' } },
      });

      if (!stock || stock.quantity < args.quantity) {
        throw new Error('Stock insuficiente para registrar salida');
      }

      const strategy = await this.resolveStrategy();
      const { unitCost } = await strategy.calcularCostoSalida({
        variantId: args.variantId,
        branchId: args.branchId,
        quantity: args.quantity,
        tx,
      });

      const lastEntry = await tx.kardexEntry.findFirst({
        where: { variantId: args.variantId, branchId: args.branchId },
        orderBy: { createdAt: 'desc' },
      });

      const newQty = stock.quantity - args.quantity;

      await tx.branchStock.update({
        where: { variantId_branchId_status: { variantId: args.variantId, branchId: args.branchId, status: 'AVAILABLE' } },
        data: { quantity: newQty },
      });

      await tx.kardexEntry.create({
        data: {
          variantId: args.variantId,
          branchId: args.branchId,
          type: 'VENTA',
          quantity: args.quantity,
          unitCost,
          balanceQty: newQty,
          balanceCost: (lastEntry?.balanceCost ?? 0) - args.quantity * unitCost,
          userId,
        },
      });
    });
  }
}
