import prisma from '@infrastructure/database/prisma';

export interface CrossBranchStockResult {
  branchId: number;
  branchName: string;
  quantity: number;
}

export class GetCrossBranchStockUseCase {
  async execute(variantId: number, userId: number): Promise<CrossBranchStockResult[]> {
    // 1. Validar que la variante exista y esté activa
    const variant = await prisma.productVariant.findFirst({
      where: {
        id: variantId,
        isActive: true,
      },
    });

    if (!variant) {
      const err = new Error(`La variante de producto con ID ${variantId} no existe o se encuentra inactiva`);
      (err as any).statusCode = 404;
      throw err;
    }

    // 2. Obtener el turno de caja abierto del usuario para identificar su sucursal actual
    const activeTurn = await prisma.cashTurn.findFirst({
      where: {
        userId: userId,
        status: 'OPEN',
      },
      include: {
        register: true,
      },
    });

    if (!activeTurn) {
      const err = new Error('No tienes un turno de caja abierto. Por favor, abre caja antes de realizar consultas de stock intersucursales.');
      (err as any).statusCode = 400;
      throw err;
    }

    const currentBranchId = activeTurn.register.branchId;

    // 3. Consultar stock en otras sucursales activas (excluyendo la actual)
    const stocks = await prisma.branchStock.findMany({
      where: {
        variantId: variantId,
        branch: {
          isActive: true,
        },
        branchId: {
          not: currentBranchId,
        },
      },
      include: {
        branch: true,
      },
      orderBy: {
        branch: {
          name: 'asc',
        },
      },
    });

    // 4. Mapear resultados
    return stocks.map((s) => ({
      branchId: s.branchId,
      branchName: s.branch.name,
      quantity: s.quantity,
    }));
  }
}
