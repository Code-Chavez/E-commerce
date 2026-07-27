import prisma from '@infrastructure/database/prisma';
import { ICreditNoteRepository, CreditNoteWithClient } from '@domain/repositories/ICreditNoteRepository';
import { CreditNote } from '@domain/entities/CreditNote';
import { RefundType } from '@domain/entities/ReturnRequest';


export class PrismaCreditNoteRepository implements ICreditNoteRepository {
  private toDomain(record: any): CreditNote {
    return {
      id: record.id,
      returnRequestId: record.returnRequestId,
      amount: record.amount,
      type: record.type as RefundType,
      code: record.code,
      usedAt: record.usedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async create(
    data: {
      returnRequestId: number;
      amount: number;
      type: RefundType;
      code: string;
    },
    tx?: any
  ): Promise<CreditNote> {
    const client = tx || prisma;
    const record = await client.creditNote.create({
      data: {
        returnRequestId: data.returnRequestId,
        amount: data.amount,
        type: data.type,
        code: data.code,
      },
    });
    return this.toDomain(record);
  }

  async findByCode(code: string): Promise<CreditNote | null> {
    const record = await prisma.creditNote.findUnique({
      where: { code },
    });
    if (!record) return null;
    return this.toDomain(record);
  }

  async findByReturnRequestId(returnRequestId: number): Promise<CreditNote | null> {
    const record = await prisma.creditNote.findUnique({
      where: { returnRequestId },
    });
    if (!record) return null;
    return this.toDomain(record);
  }

  async findAll(): Promise<CreditNoteWithClient[]> {
    const records = await prisma.creditNote.findMany({
      include: {
        returnRequest: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return records.map((record) => {
      const domain = this.toDomain(record) as CreditNoteWithClient;
      if (record.returnRequest?.user) {
        domain.client = {
          name: record.returnRequest.user.name,
          email: record.returnRequest.user.email,
        };
      }
      return domain;
    });
  }
}
