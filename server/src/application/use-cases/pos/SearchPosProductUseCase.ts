import { IPosProductRepository, PosProductResult } from '@domain/repositories/IPosProductRepository';
import prisma from '@infrastructure/database/prisma';

export class SearchPosProductUseCase {
  constructor(private readonly posProductRepository: IPosProductRepository) {}

  async execute(query: string, userId: number): Promise<PosProductResult[]> {
    // 1. Obtener el turno de caja activo (OPEN) del usuario
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
      throw new Error('No tienes un turno de caja abierto. Por favor, abre caja antes de realizar búsquedas o ventas en el POS.');
    }

    const branchId = activeTurn.register.branchId;

    // 2. Realizar búsqueda de variantes en base a la sucursal del turno
    return this.posProductRepository.searchProducts(query, branchId);
  }
}
