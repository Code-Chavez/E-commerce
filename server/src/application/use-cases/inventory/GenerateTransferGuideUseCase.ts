import prisma from '@infrastructure/database/prisma';
import { TransferGuideData } from '@domain/services/IStockTransferGuideService';

export class GenerateTransferGuideUseCase {
  async execute(id: number): Promise<TransferGuideData> {
    const transfer = await prisma.stockTransfer.findUnique({
      where: { id },
      include: {
        fromBranch: { select: { name: true, address: true } },
        toBranch: { select: { name: true, address: true } },
        variant: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
    });

    if (!transfer) {
      const err = new Error('Transferencia no encontrada');
      (err as any).statusCode = 404;
      throw err;
    }

    // El responsable es opcional en la estructura actual de transferencia,
    // pero idealmente se guarda en algún log o contexto.
    // Como simplificación y según el requerimiento, lo dejaremos en null
    // a menos que el modelo luego agregue requestedById.
    let requestedBy = null;

    return {
      guideNumber:
        transfer.guideNumber || `TR-${String(transfer.id).padStart(6, '0')}`,
      createdAt: transfer.createdAt,
      status: transfer.status,
      requestedBy,
      fromBranch: {
        name: transfer.fromBranch.name,
        address: transfer.fromBranch.address,
      },
      toBranch: {
        name: transfer.toBranch.name,
        address: transfer.toBranch.address,
      },
      variant: {
        productName: transfer.variant.product.name,
        sku: transfer.variant.sku,
      },
      quantity: transfer.quantity,
    };
  }
}
