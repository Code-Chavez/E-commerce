import { ICashTurnRepository } from '@domain/repositories/ICashTurnRepository';
import { ICashMovementRepository } from '@domain/repositories/ICashMovementRepository';
import prisma from '@infrastructure/database/prisma';

interface CloseCashTurnDTO {
  turnId: number;
  userId: number;
  closeAmount?: number;
}

interface CloseCashTurnSummary {
  turnId: number;
  openAmount: number;
  closeAmount: number;
  totalIngresos: number;
  totalEgresos: number;
  totalVentas: number;
  salesCount: number;
  expectedAmount: number;
  difference: number;
  status: 'CLOSED';
  closedAt: Date;
}

export class CloseCashTurnUseCase {
  constructor(
    private readonly cashTurnRepository: ICashTurnRepository,
    private readonly cashMovementRepository: ICashMovementRepository,
  ) {}

  async execute(dto: CloseCashTurnDTO): Promise<CloseCashTurnSummary> {
    // 1. Validar que el turno existe
    const turn = await this.cashTurnRepository.findById(dto.turnId);
    if (!turn) {
      throw new Error(`El turno de caja con ID ${dto.turnId} no existe`);
    }

    // 2. Validar que el turno esté abierto
    if (turn.status !== 'OPEN') {
      throw new Error('El turno de caja ya se encuentra cerrado');
    }

    // 3. Validar que el turno pertenezca al usuario
    if (turn.userId !== dto.userId) {
      throw new Error('No tiene permiso para cerrar este turno de caja');
    }

    // 4. Obtener la sucursal del turno a través de la caja registradora
    const register = await this.cashTurnRepository.findRegisterById(turn.registerId);
    if (!register) {
      throw new Error('La caja registradora asociada al turno no existe');
    }

    // 5. Calcular totales de movimientos
    const totalIngresos = await this.cashMovementRepository.sumByTurnAndType(dto.turnId, 'INGRESO');
    const totalEgresos = await this.cashMovementRepository.sumByTurnAndType(dto.turnId, 'EGRESO');

    // 6. Calcular total de ventas completadas durante el turno
    const salesResult = await prisma.posOrder.aggregate({
      where: {
        userId: turn.userId,
        branchId: register.branchId,
        status: 'COMPLETED',
        createdAt: {
          gte: turn.openedAt,
        },
      },
      _sum: { total: true },
      _count: true,
    });
    const totalVentas = Number(salesResult._sum.total ?? 0);
    const salesCount = salesResult._count;

    // 7. Calcular monto esperado y diferencia
    const expectedAmount = turn.openAmount + totalIngresos - totalEgresos + totalVentas;
    const closeAmount = dto.closeAmount ?? 0;
    const difference = closeAmount - expectedAmount;

    // 8. Cerrar el turno
    const closedTurn = await this.cashTurnRepository.close(dto.turnId, closeAmount);

    return {
      turnId: closedTurn.id!,
      openAmount: turn.openAmount,
      closeAmount,
      totalIngresos,
      totalEgresos,
      totalVentas,
      salesCount,
      expectedAmount,
      difference,
      status: 'CLOSED',
      closedAt: closedTurn.closedAt!,
    };
  }
}
