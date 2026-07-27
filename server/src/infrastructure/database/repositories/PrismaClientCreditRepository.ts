import prisma from '@infrastructure/database/prisma';
import { IClientCreditRepository } from '@domain/repositories/IClientCreditRepository';
import { ClientCredit } from '@domain/entities/ClientCredit';
import { CreditPayment } from '@domain/entities/CreditPayment';

export class PrismaClientCreditRepository implements IClientCreditRepository {
  private toDomainCredit(record: any): ClientCredit {
    return {
      id: record.id,
      clientId: record.clientId,
      totalAmount: Number(record.totalAmount),
      installments: record.installments,
      dueDate: record.dueDate,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      payments: record.payments ? record.payments.map((p: any) => this.toDomainPayment(p)) : [],
    };
  }

  private toDomainPayment(record: any): CreditPayment {
    return {
      id: record.id,
      creditId: record.creditId,
      amount: Number(record.amount),
      paidAt: record.paidAt,
    };
  }

  async create(data: {
    clientId: number;
    totalAmount: number;
    installments: number;
    dueDate: Date;
  }): Promise<ClientCredit> {
    const record = await prisma.clientCredit.create({
      data: {
        clientId: data.clientId,
        totalAmount: data.totalAmount,
        installments: data.installments,
        dueDate: data.dueDate,
      },
      include: {
        payments: true,
      },
    });
    return this.toDomainCredit(record);
  }

  async findById(id: string): Promise<ClientCredit | null> {
    const record = await prisma.clientCredit.findUnique({
      where: { id },
      include: {
        payments: true,
      },
    });
    return record ? this.toDomainCredit(record) : null;
  }

  async findByClientId(clientId: number): Promise<ClientCredit[]> {
    const records = await prisma.clientCredit.findMany({
      where: { clientId },
      include: {
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.toDomainCredit(r));
  }

  async createPayment(data: {
    creditId: string;
    amount: number;
  }): Promise<CreditPayment> {
    const record = await prisma.creditPayment.create({
      data: {
        creditId: data.creditId,
        amount: data.amount,
      },
    });
    return this.toDomainPayment(record);
  }
}
