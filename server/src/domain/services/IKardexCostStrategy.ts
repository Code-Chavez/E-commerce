import type { PrismaClient } from '@prisma/client';

type TX = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

export interface SalidaCostResult {
  unitCost: number;
}

export interface IKardexCostStrategy {
  calcularCostoSalida(params: {
    variantId: number;
    branchId: number;
    quantity: number;
    tx: TX;
  }): Promise<SalidaCostResult>;
}
