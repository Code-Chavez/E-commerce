import prisma from '@infrastructure/database/prisma';

export interface ConfirmCrossBranchSaleDTO {
  orderId: number;
  userId: number;
}

export class ConfirmCrossBranchSaleUseCase {
  async execute(dto: ConfirmCrossBranchSaleDTO) {
    const { orderId, userId } = dto;

    // 1. Obtener la venta
    const order = await prisma.posOrder.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      const err = new Error(`La orden de venta con ID ${orderId} no existe`);
      (err as any).statusCode = 404;
      throw err;
    }

    if (!order.isCrossBranch || !order.sourceBranchId) {
      const err = new Error('Esta orden no corresponde a una venta Cross-Branch');
      (err as any).statusCode = 400;
      throw err;
    }

    if (order.status !== 'COMPLETED') {
      const err = new Error(`No se puede confirmar una orden con estado ${order.status}`);
      (err as any).statusCode = 400;
      throw err;
    }

    // Verificar si ya fue confirmada previamente buscando en AuditLog
    const crossBranchLogs = await prisma.auditLog.findMany({
      where: {
        action: 'CONFIRM_CROSS_BRANCH',
      },
    });

    const alreadyConfirmed = crossBranchLogs.some((log) => {
      const details = log.details as Record<string, any> | null;
      return details && Number(details.orderId) === orderId;
    });

    if (alreadyConfirmed) {
      const err = new Error('Esta venta Cross-Branch ya ha sido confirmada previamente');
      (err as any).statusCode = 400;
      throw err;
    }

    const sourceBranchId = order.sourceBranchId;

    // 2. Transacción atómica
    return await prisma.$transaction(async (tx) => {
      // Validar reservas y actualizar stock + generar Kardex
      for (const item of order.items) {
        const reservedStock = await tx.branchStock.findUnique({
          where: {
            variantId_branchId_status: {
              variantId: item.variantId,
              branchId: sourceBranchId,
              status: 'RESERVED',
            },
          },
        });

        if (!reservedStock || reservedStock.quantity < item.quantity) {
          throw new Error(
            `No se encontró stock reservado suficiente para la variante ${item.variant.sku} en la sucursal de origen`
          );
        }

        // A) Decrementar stock RESERVED en origen
        await tx.branchStock.update({
          where: {
            variantId_branchId_status: {
              variantId: item.variantId,
              branchId: sourceBranchId,
              status: 'RESERVED',
            },
          },
          data: {
            quantity: { decrement: item.quantity },
          },
        });

        // B) Incrementar stock SOLD en origen (para historial/auditoría interna)
        await tx.branchStock.upsert({
          where: {
            variantId_branchId_status: {
              variantId: item.variantId,
              branchId: sourceBranchId,
              status: 'SOLD',
            },
          },
          create: {
            variantId: item.variantId,
            branchId: sourceBranchId,
            quantity: item.quantity,
            status: 'SOLD',
          },
          update: {
            quantity: { increment: item.quantity },
          },
        });

        // C) Generar asiento Kardex SALIDA en la sucursal de origen
        const lastKardex = await tx.kardexEntry.findFirst({
          where: { variantId: item.variantId, branchId: sourceBranchId },
          orderBy: { id: 'desc' },
        });

        const currentUnitCost = lastKardex ? lastKardex.unitCost : 0;
        const currentBalanceQty = lastKardex ? lastKardex.balanceQty : 0;
        const newBalanceQty = currentBalanceQty - item.quantity;
        const currentBalanceCost = lastKardex ? lastKardex.balanceCost : 0;

        await tx.kardexEntry.create({
          data: {
            variantId: item.variantId,
            branchId: sourceBranchId,
            type: 'VENTA',
            quantity: item.quantity,
            unitCost: currentUnitCost,
            balanceQty: newBalanceQty,
            balanceCost: currentBalanceCost - (item.quantity * currentUnitCost),
            userId: userId ?? null,
          },
        });
      }

      // D) Registrar en el log de auditoría
      await tx.auditLog.create({
        data: {
          action: 'CONFIRM_CROSS_BRANCH',
          module: 'POS',
          userId,
          details: {
            orderId,
            branchId: order.branchId,
            sourceBranchId,
            items: order.items.map((i) => ({
              variantId: i.variantId,
              quantity: i.quantity,
            })),
            confirmedAt: new Date().toISOString(),
          },
        },
      });

      return order;
    });
  }
}
