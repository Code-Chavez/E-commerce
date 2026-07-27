import { ICashTurnRepository } from '@domain/repositories/ICashTurnRepository';
import { ICashMovementRepository } from '@domain/repositories/ICashMovementRepository';
import { CashMovement } from '@domain/entities/CashMovement';

interface RegisterCashMovementDTO {
  turnId: number;
  type: 'INGRESO' | 'EGRESO';
  amount: number;
  reason: string;
}

export class RegisterCashMovementUseCase {
  constructor(
    private readonly cashTurnRepository: ICashTurnRepository,
    private readonly cashMovementRepository: ICashMovementRepository,
  ) {}

  async execute(dto: RegisterCashMovementDTO): Promise<CashMovement> {
    // 1. Validar que el turno existe
    const turn = await this.cashTurnRepository.findById(dto.turnId);
    if (!turn) {
      throw new Error(`El turno de caja con ID ${dto.turnId} no existe`);
    }

    // 2. Validar que el turno esté abierto
    if (turn.status !== 'OPEN') {
      throw new Error('No se puede registrar un movimiento en un turno cerrado');
    }

    // 3. Crear el movimiento
    const movement = await this.cashMovementRepository.create({
      turnId: dto.turnId,
      type: dto.type,
      amount: dto.amount,
      reason: dto.reason,
    });

    return movement;
  }
}
