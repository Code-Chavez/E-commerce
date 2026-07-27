import prisma from '@infrastructure/database/prisma';
import bcrypt from 'bcrypt';
import { requestContext } from '@infrastructure/context/RequestContext';

interface CancelSaleDTO {
  orderId: number;
  userId: number;
  userRole: string;
  adminEmail?: string;
  adminPassword?: string;
}

interface CancelSaleResult {
  orderId: number;
  status: 'CANCELLED';
  itemsReversed: number;
  cancelledAt: Date;
}

export class CancelSaleUseCase {
  async execute(dto: CancelSaleDTO): Promise<CancelSaleResult> {
    // 1. Obtener la orden con sus ítems
    const order = await prisma.posOrder.findUnique({
      where: { id: dto.orderId },
      include: {
        items: true,
        payments: true,
      },
    });

    if (!order) {
      throw new Error(`La venta con ID ${dto.orderId} no existe`);
    }

    if (order.status !== 'COMPLETED') {
      throw new Error(
        `Solo se pueden anular ventas completadas. Estado actual: ${order.status}`
      );
    }

    // 2. Verificar permisos
    if (dto.userRole !== 'ADMIN') {
      // Vendedor necesita credenciales de un admin
      if (!dto.adminEmail || !dto.adminPassword) {
        throw new Error(
          'Se requiere autorización de un administrador para anular esta venta'
        );
      }

      // Verificar que las credenciales correspondan a un admin
      const adminUser = await prisma.user.findUnique({
        where: { email: dto.adminEmail },
        include: { roles: true },
      });

      if (!adminUser) {
        throw new Error('Las credenciales de administrador no son válidas');
      }

      const isAdmin = adminUser.roles.some((role) => role.name === 'ADMIN');
      if (!isAdmin) {
        throw new Error(
          'El usuario proporcionado no tiene rol de administrador'
        );
      }

      const isPasswordValid = await bcrypt.compare(
        dto.adminPassword,
        adminUser.password
      );
      if (!isPasswordValid) {
        throw new Error('Las credenciales de administrador no son válidas');
      }
    }

    // 3. Ejecutar anulación en transacción atómica
    const result = await prisma.$transaction(async (tx) => {
      // A) Cambiar estado a CANCELLED
      await tx.posOrder.update({
        where: { id: dto.orderId },
        data: { status: 'CANCELLED' },
      });

      // B) Revertir stock y generar Kardex ENTRADA por cada ítem
      for (const item of order.items) {
        const targetBranchId =
          order.isCrossBranch && order.sourceBranchId
            ? order.sourceBranchId
            : order.branchId;

        if (order.isCrossBranch) {
          // Si es venta cruzada, determinar si revertir de RESERVED o SOLD
          const reservedStock = await tx.branchStock.findUnique({
            where: {
              variantId_branchId_status: {
                variantId: item.variantId,
                branchId: targetBranchId,
                status: 'RESERVED',
              },
            },
          });

          const reservedQty = reservedStock?.quantity ?? 0;
          const statusToDecrement =
            reservedQty >= item.quantity ? 'RESERVED' : 'SOLD';

          await tx.branchStock.update({
            where: {
              variantId_branchId_status: {
                variantId: item.variantId,
                branchId: targetBranchId,
                status: statusToDecrement,
              },
            },
            data: {
              quantity: {
                decrement: item.quantity,
              },
            },
          });
        }

        // Incrementar stock en AVAILABLE
        await tx.branchStock.update({
          where: {
            variantId_branchId_status: {
              variantId: item.variantId,
              branchId: targetBranchId,
              status: 'AVAILABLE',
            },
          },
          data: {
            quantity: {
              increment: item.quantity,
            },
          },
        });

        // Generar Kardex ENTRADA (reversión)
        const lastKardex = await tx.kardexEntry.findFirst({
          where: { variantId: item.variantId, branchId: targetBranchId },
          orderBy: { id: 'desc' },
        });

        const currentUnitCost = lastKardex ? lastKardex.balanceCost : 0;
        const currentBalanceQty = lastKardex ? lastKardex.balanceQty : 0;
        const newBalanceQty = currentBalanceQty + item.quantity;

        await tx.kardexEntry.create({
          data: {
            variantId: item.variantId,
            branchId: targetBranchId,
            type: 'DEVOLUCION',
            quantity: item.quantity,
            unitCost: currentUnitCost,
            balanceQty: newBalanceQty,
            balanceCost: currentUnitCost,
            userId: requestContext.getStore()?.userId ?? null,
          },
        });
      }

      return {
        orderId: dto.orderId,
        status: 'CANCELLED' as const,
        itemsReversed: order.items.length,
        cancelledAt: new Date(),
      };
    });

    return result;
  }
}
