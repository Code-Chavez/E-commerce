import { Prisma } from '@prisma/client';

/**
 * T-100: Prisma Client Extension that intercepts BranchStock mutations
 * and automatically creates the corresponding KardexEntry.
 */
export const kardexExtension = Prisma.defineExtension({
  name: 'kardexExtension',
  model: {
    branchStock: {
      async upsertWithKardex(
        this: any,
        args: {
          variantId: number;
          branchId: number;
          quantityDelta: number;
          type: 'COMPRA' | 'VENTA' | 'TRANSFERENCIA' | 'DEVOLUCION' | 'AJUSTE';
          unitCost: number;
          newQuantity?: number;
        }
      ) {
        const ctx = Prisma.getExtensionContext(this);
        const client = (ctx as any).$parent as any;

        return client.$transaction(async (tx: any) => {
          const existing = await tx.branchStock.findUnique({
            where: {
              variantId_branchId_status: {
                variantId: args.variantId,
                branchId: args.branchId,
                status: 'AVAILABLE',
              },
            },
          });

          const prevQty = existing?.quantity ?? 0;
          const newQty =
            args.newQuantity !== undefined
              ? args.newQuantity
              : prevQty + args.quantityDelta;

          const stock = await tx.branchStock.upsert({
            where: {
              variantId_branchId_status: {
                variantId: args.variantId,
                branchId: args.branchId,
                status: 'AVAILABLE',
              },
            },
            create: {
              variantId: args.variantId,
              branchId: args.branchId,
              quantity: newQty,
              status: 'AVAILABLE',
            },
            update: { quantity: newQty },
          });

          const lastEntry = await tx.kardexEntry.findFirst({
            where: { variantId: args.variantId, branchId: args.branchId },
            orderBy: { createdAt: 'desc' },
          });

          const balanceCost =
            (lastEntry?.balanceCost ?? 0) + args.quantityDelta * args.unitCost;

          await tx.kardexEntry.create({
            data: {
              variantId: args.variantId,
              branchId: args.branchId,
              type: args.type,
              quantity: Math.abs(args.quantityDelta),
              unitCost: args.unitCost,
              balanceQty: newQty,
              balanceCost,
            },
          });

          return stock;
        });
      },
    },
  },
});
