import prisma from '@infrastructure/database/prisma';
import { ICashMovementRepository, CreateCashMovementDTO } from '@domain/repositories/ICashMovementRepository';
import { CashMovement } from '@domain/entities/CashMovement';

export class PrismaCashMovementRepository implements ICashMovementRepository {
  async create(data: CreateCashMovementDTO): Promise<CashMovement> {
    const record = await prisma.cashMovement.create({
      data: {
        turnId: data.turnId,
        type: data.type,
        amount: data.amount,
        reason: data.reason,
      },
    });

    return this.toDomain(record);
  }

  async findByTurnId(turnId: number): Promise<CashMovement[]> {
    const records = await prisma.cashMovement.findMany({
      where: { turnId },
      orderBy: { createdAt: 'asc' },
    });
    return records.map((record) => this.toDomain(record));
  }

  async sumByTurnAndType(turnId: number, type: 'INGRESO' | 'EGRESO'): Promise<number> {
    const result = await prisma.cashMovement.aggregate({
      where: { turnId, type },
      _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
  }

  private toDomain(record: any): CashMovement {
    return {
      id: record.id,
      turnId: record.turnId,
      type: record.type,
      amount: record.amount,
      reason: record.reason,
      createdAt: record.createdAt,
    };
  }
}
