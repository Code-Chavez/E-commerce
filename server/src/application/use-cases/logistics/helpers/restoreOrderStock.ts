import { Prisma } from '@prisma/client';

export interface RestorableItem {
  variantId: number;
  qty: number;
}

/**
 * Reincorpora el stock de los ítems de un pedido a la sucursal principal
 * y genera los asientos de Kardex (DEVOLUCION) correspondientes.
 * Debe ejecutarse dentro de una transacción Prisma.
 */
export async function restoreOrderStock(
  tx: Prisma.TransactionClient,
  items: RestorableItem[],
  userId: number | null,
  notes?: string,
): Promise<void> {
  let mainBranch = await tx.branch.findFirst({
    where: { isMain: true, isActive: true },
  });

  if (!mainBranch) {
    mainBranch = await tx.branch.findFirst({
      where: { isActive: true },
      orderBy: { id: 'asc' },
    });
  }

  if (!mainBranch) {
    throw new Error('No se encontró ninguna sucursal activa para reincorporar el stock');
  }

  for (const item of items) {
    let stock = await tx.branchStock.findUnique({
      where: {
        variantId_branchId_status: {
          variantId: item.variantId,
          branchId: mainBranch.id,
          status: 'AVAILABLE',
        },
      },
    });

    if (!stock) {
      stock = await tx.branchStock.create({
        data: {
          variantId: item.variantId,
          branchId: mainBranch.id,
          status: 'AVAILABLE',
          quantity: 0,
        },
      });
    }

    const newQty = Number(stock.quantity) + item.qty;

    await tx.branchStock.update({
      where: { id: stock.id },
      data: { quantity: newQty },
    });

    const lastKardex = await tx.kardexEntry.findFirst({
      where: { variantId: item.variantId, branchId: mainBranch.id },
      orderBy: { id: 'desc' },
    });

    const unitCost = lastKardex?.unitCost ?? 0;
    const lastBalanceCost = lastKardex?.balanceCost ?? 0;
    const newBalanceCost = lastBalanceCost + (item.qty * unitCost);

    await tx.kardexEntry.create({
      data: {
        variantId: item.variantId,
        branchId: mainBranch.id,
        type: 'DEVOLUCION',
        quantity: item.qty,
        unitCost,
        balanceQty: newQty,
        balanceCost: newBalanceCost,
        notes: notes ?? null,
        userId,
      },
    });
  }
}
