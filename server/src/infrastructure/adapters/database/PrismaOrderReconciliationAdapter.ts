import prisma from '@infrastructure/database/prisma';
import { IOrderRepositoryPort } from '@domain/reconciliation/ports/IOrderRepositoryPort';
import { LocalOrderInfo } from '@domain/reconciliation/models/ReconciliationResult';

export class PrismaOrderReconciliationAdapter implements IOrderRepositoryPort {
  async getOrdersByDateRange(from: Date, to: Date): Promise<LocalOrderInfo[]> {
    const records = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: from,
          lte: to,
        },
      },
      select: {
        id: true,
        paymentIntentId: true,
        total: true,
        status: true,
        createdAt: true,
      },
    });

    return records.map((record) => ({
      id: record.id,
      paymentIntentId: record.paymentIntentId,
      total: Number(record.total),
      status: record.status,
      createdAt: record.createdAt,
    }));
  }
}
