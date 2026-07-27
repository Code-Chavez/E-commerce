import { PrismaClient } from '@prisma/client';
import { requestContext } from '@infrastructure/context/RequestContext';

const prismaInstance = new PrismaClient();

const extendedPrisma = prismaInstance.$extends({
  query: {
    order: {
      async update({ model, operation, args, query }) {
        const orderId = (args.where as any).id;
        let oldStatus: string | undefined;

        if (orderId && args.data.status !== undefined) {
          const existing = await prismaInstance.order.findUnique({
            where: { id: orderId },
            select: { status: true },
          });
          oldStatus = existing?.status;
        }

        if (args.data.status !== undefined && oldStatus !== args.data.status) {
          const store = requestContext.getStore();
          const changedBy = store?.email || (store?.userId ? `User #${store.userId}` : 'SYSTEM');

          // Use nested write to create the OrderStatusLog inside the same transaction to avoid deadlocks
          args.data = {
            ...args.data,
            statusLogs: {
              ...(args.data.statusLogs as any || {}),
              create: {
                status: args.data.status as any,
                changedBy: changedBy,
              },
            },
          };
        }

        const result = await query(args);
        return result;
      },
    },
  },
});

export const prisma = extendedPrisma as unknown as PrismaClient;
export default prisma;
