import prisma from '@infrastructure/database/prisma';
import { ICashRegisterRepository, CreateCashRegisterDTO, UpdateCashRegisterDTO, CashRegisterWithBranchName } from '@domain/repositories/ICashRegisterRepository';
import { CashRegister } from '@domain/entities/CashTurn';

export class PrismaCashRegisterRepository implements ICashRegisterRepository {
  async create(data: CreateCashRegisterDTO): Promise<CashRegister> {
    const record = await prisma.cashRegister.create({
      data: {
        branchId: data.branchId,
        name: data.name,
      },
    });
    return this.toDomain(record);
  }

  async findAll(): Promise<CashRegisterWithBranchName[]> {
    const records = await prisma.cashRegister.findMany({
      where: { isActive: true },
      include: { branch: true },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((r: any) => ({
      id: r.id,
      branchId: r.branchId,
      name: r.name,
      branchName: r.branch.name,
      createdAt: r.createdAt,
    }));
  }

  async findById(id: number): Promise<CashRegister | null> {
    const record = await prisma.cashRegister.findFirst({
      where: { id, isActive: true },
    });
    return record ? this.toDomain(record) : null;
  }

  async update(id: number, data: UpdateCashRegisterDTO): Promise<CashRegister> {
    const record = await prisma.cashRegister.update({
      where: { id },
      data: {
        branchId: data.branchId,
        name: data.name,
      },
    });
    return this.toDomain(record);
  }

  async delete(id: number): Promise<void> {
    await prisma.cashRegister.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async hasTurns(id: number): Promise<boolean> {
    const count = await prisma.cashTurn.count({
      where: { registerId: id },
    });
    return count > 0;
  }

  private toDomain(record: any): CashRegister {
    return {
      id: record.id,
      branchId: record.branchId,
      name: record.name,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
