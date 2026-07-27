import { ICashRegisterRepository } from '@domain/repositories/ICashRegisterRepository';
import prisma from '@infrastructure/database/prisma';

export class DeleteCashRegisterUseCase {
  constructor(private readonly cashRegisterRepository: ICashRegisterRepository) {}

  async execute(id: number): Promise<void> {
    // 1. Validar que la caja exista
    const register = await this.cashRegisterRepository.findById(id);
    if (!register) {
      throw new Error(`La caja registradora con ID ${id} no existe o ya fue eliminada`);
    }

    // 2. Validar que no tenga un turno abierto actualmente
    const activeTurn = await prisma.cashTurn.findFirst({
      where: {
        registerId: id,
        status: 'OPEN',
      },
    });

    if (activeTurn) {
      const err = new Error(`No se puede desactivar la caja registradora porque tiene un turno abierto actualmente`);
      (err as any).statusCode = 409;
      throw err;
    }

    // 3. Realizar la eliminación lógica
    await this.cashRegisterRepository.delete(id);
  }
}
