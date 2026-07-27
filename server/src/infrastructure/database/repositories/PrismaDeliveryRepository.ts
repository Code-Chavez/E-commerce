import prisma from '@infrastructure/database/prisma';
import { IDeliveryRepository } from '@domain/repositories/IDeliveryRepository';
import { Delivery, PickingItem } from '@domain/entities/Delivery';

export class PrismaDeliveryRepository implements IDeliveryRepository {
  private toDomain(record: any): Delivery {
    return {
      id: record.id,
      orderId: record.orderId,
      deliveryManId: record.deliveryManId,
      status: record.status,
      type: record.type,
      returnRequestId: record.returnRequestId,
      parentDeliveryId: record.parentDeliveryId ?? null,
      deliveryPhotoUrl: record.deliveryPhotoUrl ?? null,
      deliveredAt: record.deliveredAt ?? null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      pickingItems: record.pickingItems?.map((item: any) =>
        this.toPickingItemDomain(item)
      ),
      failedAttempts: record.failedAttempts?.map((a: any) => ({
        id: a.id,
        deliveryId: a.deliveryId,
        reason: a.reason,
        attemptedAt: a.attemptedAt,
        rescheduledFor: a.rescheduledFor,
      })),
    };
  }

  private toPickingItemDomain(item: any): PickingItem {
    return {
      id: item.id,
      deliveryId: item.deliveryId,
      variantId: item.variantId,
      qty: item.qty,
      pickedAt: item.pickedAt,
      variantSku: item.variant?.sku,
      productName: item.variant?.product?.name,
    };
  }

  async findById(id: number): Promise<Delivery | null> {
    const record = await prisma.delivery.findUnique({
      where: { id },
      include: {
        pickingItems: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
        order: {
          include: {
            user: true,
          },
        },
      },
    });
    if (!record) return null;
    const domainObj = this.toDomain(record);
    if (record.order) {
      (domainObj as any).orderUser = record.order.user;
      (domainObj as any).orderAddress = record.order.addressSnapshot;
    }
    return domainObj;
  }

  async createDeliveryWithItems(
    orderId: number,
    items: Array<{ variantId: number; qty: number }>
  ): Promise<Delivery> {
    const record = await prisma.delivery.create({
      data: {
        orderId,
        status: 'PENDING',
        pickingItems: {
          create: items.map((item) => ({
            variantId: item.variantId,
            qty: item.qty,
          })),
        },
      },
      include: {
        pickingItems: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });
    return this.toDomain(record);
  }

  async createPickupOrder(
    orderId: number,
    returnRequestId: number,
    items: Array<{ variantId: number; qty: number }>,
    tx?: any
  ): Promise<Delivery> {
    const prismaClient = tx || prisma;
    const record = await prismaClient.delivery.create({
      data: {
        orderId,
        returnRequestId,
        status: 'PENDING',
        type: 'PICKUP',
        pickingItems: {
          create: items.map((item) => ({
            variantId: item.variantId,
            qty: item.qty,
          })),
        },
      },
      include: {
        pickingItems: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });
    return this.toDomain(record);
  }

  async assignDeliveryMan(
    id: number,
    deliveryManId: number
  ): Promise<Delivery> {
    const record = await prisma.delivery.update({
      where: { id },
      data: {
        deliveryManId,
        status: 'ASSIGNED',
      },
      include: {
        pickingItems: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
        order: {
          include: {
            user: true,
          },
        },
      },
    });
    const domainObj = this.toDomain(record);
    if (record.order) {
      (domainObj as any).orderUser = record.order.user;
      (domainObj as any).orderAddress = record.order.addressSnapshot;
    }
    return domainObj;
  }

  async findPaidOrdersWithoutDelivery(orderIds?: number[]): Promise<any[]> {
    const whereClause: any = {
      status: 'PAID',
      deliveries: {
        none: {
          type: 'DELIVERY',
        },
      },
    };

    if (orderIds && orderIds.length > 0) {
      whereClause.id = {
        in: orderIds,
      };
    }

    return await prisma.order.findMany({
      where: whereClause,
      include: {
        items: true,
        user: true,
      },
    });
  }

  async findDeliveries(status?: string): Promise<Delivery[]> {
    const whereClause: any = {};
    if (status) {
      whereClause.status = status as any;
    }

    const records = await prisma.delivery.findMany({
      where: whereClause,
      include: {
        pickingItems: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
        failedAttempts: {
          orderBy: { attemptedAt: 'asc' },
        },
        order: {
          include: {
            user: true,
          },
        },
      },
    });
    return records.map((record) => {
      const domainObj = this.toDomain(record);
      if (record.order) {
        (domainObj as any).orderUser = record.order.user;
        (domainObj as any).orderAddress = record.order.addressSnapshot;
      }
      return domainObj;
    });
  }

  async updateStatus(id: number, status: string): Promise<Delivery> {
    const record = await prisma.delivery.update({
      where: { id },
      data: { status: status as any },
      include: {
        pickingItems: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
        order: {
          include: {
            user: true,
          },
        },
      },
    });

    let newOrderStatus: string | null = null;
    if (status === 'IN_TRANSIT') {
      newOrderStatus = 'SHIPPED';
    } else if (status === 'DELIVERED') {
      newOrderStatus = 'DELIVERED';
    } else if (status === 'FAILED') {
      newOrderStatus = 'FAILED';
    } else if (status === 'RETURNED') {
      newOrderStatus = 'RETURNED';
    }

    if (
      record.type === 'DELIVERY' &&
      newOrderStatus &&
      record.order &&
      record.order.status !== newOrderStatus
    ) {
      await prisma.order.update({
        where: { id: record.orderId },
        data: { status: newOrderStatus as any },
      });
      record.order.status = newOrderStatus as any;
    }

    const domainObj = this.toDomain(record);
    if (record.order) {
      (domainObj as any).orderUser = record.order.user;
      (domainObj as any).orderAddress = record.order.addressSnapshot;
    }
    return domainObj;
  }
}
