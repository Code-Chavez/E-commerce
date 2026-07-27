import type { IKardexCostStrategy, SalidaCostResult } from '@domain/services/IKardexCostStrategy';

export class PromedioStrategy implements IKardexCostStrategy {
  async calcularCostoSalida(params: {
    variantId: number;
    branchId: number;
    quantity: number;
    tx: any;
  }): Promise<SalidaCostResult> {
    const lastEntry = await params.tx.kardexEntry.findFirst({
      where: { variantId: params.variantId, branchId: params.branchId },
      orderBy: { createdAt: 'desc' },
    });
    return { unitCost: lastEntry?.unitCost ?? 0 };
  }
}
