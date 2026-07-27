import prisma from '@infrastructure/database/prisma';

export interface PendingCrossBranchOrder {
  orderId: number;
  destinationBranchId: number;
  destinationBranchName: string;
  totalAmount: number;
  createdAt: Date;
  items: Array<{
    variantId: number;
    sku: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface PendingCrossBranchGroup {
  sourceBranchId: number;
  sourceBranchName: string;
  pendingOrdersCount: number;
  totalReservedUnits: number;
  orders: PendingCrossBranchOrder[];
}

export class GetPendingCrossBranchSalesUseCase {
  async execute(): Promise<PendingCrossBranchGroup[]> {
    // 1. Obtener todas las órdenes completadas de tipo Cross-Branch
    const orders = await prisma.posOrder.findMany({
      where: {
        isCrossBranch: true,
        status: 'COMPLETED',
        sourceBranchId: { not: null },
      },
      include: {
        branch: true,
        sourceBranch: true,
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
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (orders.length === 0) {
      return [];
    }

    // 2. Obtener todas las confirmaciones registradas en el log de auditoría
    // para excluir las que ya fueron entregadas.
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        action: 'CONFIRM_CROSS_BRANCH',
      },
    });

    // Filtramos manualmente basándonos en los detalles almacenados en JSON
    const confirmedOrderIds = new Set<number>();
    for (const log of auditLogs) {
      if (log.details && typeof log.details === 'object') {
        const detailsObj = log.details as Record<string, any>;
        if (typeof detailsObj.orderId === 'number') {
          confirmedOrderIds.add(detailsObj.orderId);
        }
      }
    }

    // 3. Filtrar órdenes que NO están confirmadas
    const pendingOrders = orders.filter((o) => !confirmedOrderIds.has(o.id));

    if (pendingOrders.length === 0) {
      return [];
    }

    // 4. Agrupar por sourceBranchId
    const groupsMap = new Map<number, PendingCrossBranchGroup>();

    for (const order of pendingOrders) {
      const sourceBranchId = order.sourceBranchId!;
      const sourceBranchName = order.sourceBranch?.name || `Sucursal ${sourceBranchId}`;

      let group = groupsMap.get(sourceBranchId);
      if (!group) {
        group = {
          sourceBranchId,
          sourceBranchName,
          pendingOrdersCount: 0,
          totalReservedUnits: 0,
          orders: [],
        };
        groupsMap.set(sourceBranchId, group);
      }

      let orderReservedUnits = 0;
      const mappedItems = order.items.map((item) => {
        orderReservedUnits += item.quantity;
        return {
          variantId: item.variantId,
          sku: item.variant.sku,
          productName: item.variant.product.name,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
        };
      });

      group.pendingOrdersCount += 1;
      group.totalReservedUnits += orderReservedUnits;
      group.orders.push({
        orderId: order.id,
        destinationBranchId: order.branchId,
        destinationBranchName: order.branch.name,
        totalAmount: Number(order.total),
        createdAt: order.createdAt,
        items: mappedItems,
      });
    }

    // Retornar en forma de arreglo ordenado por nombre de sucursal de origen
    return Array.from(groupsMap.values()).sort((a, b) =>
      a.sourceBranchName.localeCompare(b.sourceBranchName)
    );
  }
}
