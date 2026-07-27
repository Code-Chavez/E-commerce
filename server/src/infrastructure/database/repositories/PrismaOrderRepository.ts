import prisma from '@infrastructure/database/prisma';
import { IOrderRepository } from '@domain/repositories/IOrderRepository';
import { Order, OrderItem, OrderStatus } from '@domain/entities/Order';

export class PrismaOrderRepository implements IOrderRepository {
  private toDomain(record: any): Order {
    return {
      id: record.id,
      userId: record.userId,
      status: record.status,
      total: Number(record.total),
      shippingCost: Number(record.shippingCost),
      addressSnapshot: record.addressSnapshot,
      paymentIntentId: record.paymentIntentId,
      deliveryPin: record.deliveryPin ?? null,
      refundStatus: record.refundStatus,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      items: record.items?.map((item: any) => this.toItemDomain(item)),
      statusLogs: record.statusLogs?.map((log: any) => ({
        id: log.id,
        orderId: log.orderId,
        status: log.status,
        changedAt: log.changedAt,
        changedBy: log.changedBy,
      })),
      isRedelivery: !!record.deliveries?.[0]?.parentDeliveryId,
      currentDeliveryStatus: record.deliveries?.[0]?.status ?? null,
      failedAttempts: record.deliveries?.[0]?.failedAttempts?.map((a: any) => ({
        reason: a.reason,
        attemptedAt: a.attemptedAt,
        rescheduledFor: a.rescheduledFor,
      })),
      returnRequests: record.returnRequests?.map((req: any) => ({
        id: req.id,
        status: req.status,
        reason: req.reason,
        pickupOrder: req.pickupOrder
          ? {
              id: req.pickupOrder.id,
              status: req.pickupOrder.status,
              type: req.pickupOrder.type,
              createdAt: req.pickupOrder.createdAt,
              updatedAt: req.pickupOrder.updatedAt,
            }
          : null,
      })),
    };
  }

  private toItemDomain(item: any): OrderItem {
    return {
      id: item.id,
      orderId: item.orderId,
      variantId: item.variantId,
      qty: item.qty,
      unitPrice: Number(item.unitPrice),
      variantSku: item.variant?.sku,
      productName: item.variant?.product?.name,
    };
  }

  async findById(id: number): Promise<Order | null> {
    const record = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
        statusLogs: true,
        returnRequests: true,
      },
    });
    return record ? this.toDomain(record) : null;
  }

  async findByPaymentIntentId(paymentIntentId: string): Promise<Order | null> {
    const record = await prisma.order.findUnique({
      where: { paymentIntentId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
        statusLogs: true,
      },
    });
    return record ? this.toDomain(record) : null;
  }

  async createOrderWithTransaction(
    orderData: {
      userId: number;
      status: string;
      total: number;
      shippingCost: number;
      addressSnapshot: any;
      paymentIntentId: string;
    },
    items: Array<{
      variantId: number;
      qty: number;
      unitPrice: number;
    }>
  ): Promise<Order> {
    const record = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId: orderData.userId,
          status: orderData.status as any,
          total: orderData.total,
          shippingCost: orderData.shippingCost,
          addressSnapshot: orderData.addressSnapshot,
          paymentIntentId: orderData.paymentIntentId,
        },
      });

      const createdItems = [];
      for (const item of items) {
        const createdItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            variantId: item.variantId,
            qty: item.qty,
            unitPrice: item.unitPrice,
          },
        });
        createdItems.push(createdItem);
      }

      return {
        ...order,
        items: createdItems,
      };
    });

    return this.toDomain(record);
  }

  async findByUserId(
    userId: number,
    params: {
      status?: string;
      skip: number;
      take: number;
    }
  ): Promise<{ orders: Order[]; totalCount: number }> {
    const whereClause: any = { userId };
    
    if (params.status) {
      whereClause.status = params.status as any;
    }

    const [records, totalCount] = await prisma.$transaction([
      prisma.order.findMany({
        where: whereClause,
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: true,
                },
              },
            },
          },
          statusLogs: true,
          returnRequests: {
            include: {
              pickupOrder: {
                select: {
                  id: true,
                  status: true,
                  type: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
            },
          },
          deliveries: {
            where: { type: 'DELIVERY' },
            orderBy: { id: 'desc' },
            take: 1,
            include: {
              failedAttempts: {
                orderBy: { attemptedAt: 'desc' },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: params.skip,
        take: params.take,
      }),
      prisma.order.count({
        where: whereClause,
      }),
    ]);

    return {
      orders: records.map((r) => this.toDomain(r)),
      totalCount,
    };
  }

  async updateStatus(id: number, status: OrderStatus): Promise<Order> {
    const record = await prisma.order.update({
      where: { id },
      data: { status: status as any },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
        statusLogs: true,
      },
    });

    return this.toDomain(record);
  }

  async findAdminOrders(params: {
    status?: string;
    from?: Date;
    to?: Date;
    cursor?: number;
    limit: number;
    userId?: number;
  }): Promise<{ orders: Order[]; nextCursor: number | null }> {
    const where: any = {};
    if (params.status) {
      where.status = params.status;
    }
    if (params.userId) {
      where.userId = params.userId;
    }
    if (params.from || params.to) {
      where.createdAt = {};
      if (params.from) where.createdAt.gte = params.from;
      if (params.to) where.createdAt.lte = params.to;
    }

    const records = await prisma.order.findMany({
      where,
      take: params.limit + 1,
      ...(params.cursor && {
        cursor: { id: params.cursor },
      }),
      orderBy: { id: 'desc' },
      include: {
        user: true,
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
        returnRequests: true,
      },
    });

    let nextCursor: number | null = null;
    if (records.length > params.limit) {
      const nextItem = records.pop();
      nextCursor = nextItem!.id;
    }

    const orders = records.map((record) => {
      const order = this.toDomain(record);
      order.user = {
        id: record.user.id,
        name: `${record.user.name || ''} ${record.user.lastName || ''}`.trim(),
        email: record.user.email,
      };
      return order;
    });

    return { orders, nextCursor };
  }

  async getSalesTotalInRange(start: Date, end: Date): Promise<number> {
    const result = await prisma.order.aggregate({
      where: {
        status: {
          in: ['PAID', 'SHIPPED', 'DELIVERED'],
        },
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        total: true,
      },
    });
    return result._sum.total ? Number(result._sum.total) : 0;
  }

  async countPending(): Promise<number> {
    const count = await prisma.order.count({
      where: {
        status: 'PENDING',
      },
    });
    return count;
  }

  async findOrdersForExport(params: { from?: Date; to?: Date }): Promise<Order[]> {
    const { from, to } = params;
    const where: any = {
      status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] },
    };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = from;
      if (to) where.createdAt.lte = to;
    }
    const records = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.toDomain(r));
  }

  async getProfitabilityData(from?: Date, to?: Date): Promise<Array<{
    qty: number;
    unitPrice: number;
    variantId: number;
    brandName: string;
    categoryName: string;
    orderCreatedAt: Date;
    unitCost: number;
  }>> {
    const where: any = {
      order: {
        status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] },
      },
    };

    if (from || to) {
      where.order.createdAt = {};
      if (from) where.order.createdAt.gte = from;
      if (to) where.order.createdAt.lte = to;
    }

    const records = await prisma.orderItem.findMany({
      where,
      include: {
        order: {
          select: {
            createdAt: true,
          },
        },
        variant: {
          include: {
            product: {
              include: {
                brand: true,
                category: true,
              },
            },
          },
        },
      },
    });

    const result = await Promise.all(
      records.map(async (r) => {
        const lastKardex = await prisma.kardexEntry.findFirst({
          where: {
            variantId: r.variantId,
            createdAt: {
              lte: r.order.createdAt,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        return {
          qty: r.qty,
          unitPrice: Number(r.unitPrice),
          variantId: r.variantId,
          brandName: r.variant?.product?.brand?.name || 'Sin Marca',
          categoryName: r.variant?.product?.category?.name || 'Sin Categoría',
          orderCreatedAt: r.order.createdAt,
          unitCost: lastKardex ? Number(lastKardex.unitCost) : Number(r.variant?.costPrice ?? 0),
        };
      })
    );

    return result;
  }

  async getFinancialSales(from?: Date, to?: Date): Promise<Array<{
    amount: number;
    createdAt: Date;
  }>> {
    const where: any = {
      status: {
        in: ['PAID', 'SHIPPED', 'DELIVERED'],
      },
    };

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = from;
      if (to) where.createdAt.lte = to;
    }

    const records = await prisma.order.findMany({
      where,
      select: {
        total: true,
        createdAt: true,
      },
    });

    return records.map((r) => ({
      amount: Number(r.total),
      createdAt: r.createdAt,
    }));
  }
}



