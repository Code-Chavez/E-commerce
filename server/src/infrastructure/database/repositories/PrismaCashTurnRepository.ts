import prisma from '@infrastructure/database/prisma';
import { ICashTurnRepository, CreateCashTurnDTO } from '@domain/repositories/ICashTurnRepository';
import { CashTurn, CashRegister } from '@domain/entities/CashTurn';

export class PrismaCashTurnRepository implements ICashTurnRepository {
  async create(data: CreateCashTurnDTO): Promise<CashTurn> {
    const record = await prisma.cashTurn.create({
      data: {
        registerId: data.registerId,
        userId: data.userId,
        openAmount: data.openAmount,
        status: 'OPEN',
      },
    });

    return this.toDomain(record);
  }

  async findActiveByUser(userId: number): Promise<CashTurn | null> {
    const record = await prisma.cashTurn.findFirst({
      where: { userId, status: 'OPEN' },
      include: {
        register: {
          include: { branch: { select: { id: true, igvExempt: true } } },
        },
      },
    });
    return record ? this.toDomain(record) : null;
  }

  async findActiveByRegister(registerId: number): Promise<CashTurn | null> {
    const record = await prisma.cashTurn.findFirst({
      where: { registerId, status: 'OPEN' },
    });
    return record ? this.toDomain(record) : null;
  }

  async findRegisterById(registerId: number): Promise<CashRegister | null> {
    const record = await prisma.cashRegister.findUnique({
      where: { id: registerId },
    });
    return record ? {
      id: record.id,
      branchId: record.branchId,
      name: record.name,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    } : null;
  }

  async findRegistersByBranch(branchId: number): Promise<CashRegister[]> {
    const records = await prisma.cashRegister.findMany({
      where: { branchId },
    });
    return records.map((record) => ({
      id: record.id,
      branchId: record.branchId,
      name: record.name,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }));
  }

  async findById(id: number): Promise<CashTurn | null> {
    const record = await prisma.cashTurn.findUnique({
      where: { id },
    });
    return record ? this.toDomain(record) : null;
  }

  async close(id: number, closeAmount: number): Promise<CashTurn> {
    const record = await prisma.cashTurn.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        closeAmount,
      },
    });
    return this.toDomain(record);
  }

  private toDomain(record: any): CashTurn {
    return {
      id: record.id,
      registerId: record.registerId,
      userId: record.userId,
      openAmount: record.openAmount,
      closeAmount: record.closeAmount,
      status: record.status as any,
      openedAt: record.openedAt,
      closedAt: record.closedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      branchId: record.register?.branch?.id ?? null,
      igvExempt: record.register?.branch?.igvExempt ?? false,
    };
  }
}

