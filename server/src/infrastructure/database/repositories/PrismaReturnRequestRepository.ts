import prisma from '@infrastructure/database/prisma';
import { IReturnRequestRepository } from '@domain/repositories/IReturnRequestRepository';
import {
  ReturnRequest,
  ReturnRequestItem,
  ReturnStatus,
} from '@domain/entities/ReturnRequest';

export class PrismaReturnRequestRepository implements IReturnRequestRepository {
  private toDomain(record: any): ReturnRequest {
    return {
      id: record.id,
      orderId: record.orderId,
      userId: record.userId,
      reason: record.reason,
      status: record.status as ReturnStatus,
      refundType: record.refundType,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      items: record.items?.map((item: any) => this.toItemDomain(item)),
    };
  }

  private toItemDomain(item: any): ReturnRequestItem {
    return {
      id: item.id,
      returnRequestId: item.returnRequestId,
      orderItemId: item.orderItemId,
      qty: item.qty,
    };
  }

  async create(data: {
    orderId: number;
    userId: number;
    reason: string;
    refundType: 'CREDIT_NOTE' | 'STORE_CREDIT';
    items: Array<{ orderItemId: number; qty: number }>;
  }): Promise<ReturnRequest> {
    const record = await prisma.returnRequest.create({
      data: {
        orderId: data.orderId,
        userId: data.userId,
        reason: data.reason,
        refundType: data.refundType,
        items: {
          create: data.items.map((item) => ({
            orderItemId: item.orderItemId,
            qty: item.qty,
          })),
        },
      },
      include: {
        items: true,
      },
    });
    return this.toDomain(record);
  }

  async findById(id: number): Promise<ReturnRequest | null> {
    const record = await prisma.returnRequest.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });
    if (!record) return null;
    return this.toDomain(record);
  }

  async findAll(): Promise<ReturnRequest[]> {
    const records = await prisma.returnRequest.findMany({
      include: {
        items: {
          include: {
            orderItem: {
              include: {
                variant: {
                  include: {
                    product: true,
                  },
                },
              },
            },
          },
        },
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    // the returned data might have more fields than ReturnRequest domain entity, but this is useful for the admin list
    return records.map((record) => ({
      ...this.toDomain(record),
      user: {
        name: record.user?.name,
        email: record.user?.email,
      },
      rawItems: record.items, // attach expanded items for admin
    })) as any; // Cast as any because we enrich the domain entity for the admin response
  }

  async updateStatus(id: number, status: ReturnStatus): Promise<ReturnRequest> {
    const record = await prisma.returnRequest.update({
      where: { id },
      data: { status },
      include: {
        items: true,
      },
    });
    return this.toDomain(record);
  }
}
