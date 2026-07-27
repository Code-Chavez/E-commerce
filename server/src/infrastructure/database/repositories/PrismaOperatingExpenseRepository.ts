import prisma from '@infrastructure/database/prisma';
import { IOperatingExpenseRepository } from '@domain/repositories/IOperatingExpenseRepository';
import { OperatingExpense, CreateOperatingExpenseDTO, UpdateOperatingExpenseDTO } from '@domain/entities/OperatingExpense';

export class PrismaOperatingExpenseRepository implements IOperatingExpenseRepository {
  private toDomain(record: any): OperatingExpense {
    return {
      id: record.id,
      branchId: record.branchId,
      type: record.type,
      description: record.description,
      amount: Number(record.amount),
      date: record.date,
      userId: record.userId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async create(data: CreateOperatingExpenseDTO): Promise<OperatingExpense> {
    const record = await prisma.operatingExpense.create({
      data: {
        branchId: data.branchId,
        type: data.type,
        description: data.description,
        amount: data.amount,
        date: data.date,
        userId: data.userId,
      },
    });
    return this.toDomain(record);
  }

  async findById(id: number): Promise<OperatingExpense | null> {
    const record = await prisma.operatingExpense.findUnique({
      where: { id },
    });
    return record ? this.toDomain(record) : null;
  }

  async findAll(filters: { branchId?: number; from?: Date; to?: Date }): Promise<OperatingExpense[]> {
    const where: any = {};
    if (filters.branchId) {
      where.branchId = filters.branchId;
    }
    if (filters.from || filters.to) {
      where.date = {};
      if (filters.from) {
        where.date.gte = filters.from;
      }
      if (filters.to) {
        where.date.lte = filters.to;
      }
    }

    const records = await prisma.operatingExpense.findMany({
      where,
      orderBy: { date: 'desc' },
    });
    return records.map((r) => this.toDomain(r));
  }

  async update(id: number, data: UpdateOperatingExpenseDTO): Promise<OperatingExpense> {
    const record = await prisma.operatingExpense.update({
      where: { id },
      data: {
        branchId: data.branchId,
        type: data.type,
        description: data.description,
        amount: data.amount,
        date: data.date,
      },
    });
    return this.toDomain(record);
  }

  async delete(id: number): Promise<void> {
    await prisma.operatingExpense.delete({
      where: { id },
    });
  }
}
