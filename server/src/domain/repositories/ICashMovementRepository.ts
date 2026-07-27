import { CashMovement } from '../entities/CashMovement';

export interface CreateCashMovementDTO {
  turnId: number;
  type: 'INGRESO' | 'EGRESO';
  amount: number;
  reason: string;
}

export interface ICashMovementRepository {
  create(data: CreateCashMovementDTO): Promise<CashMovement>;
  findByTurnId(turnId: number): Promise<CashMovement[]>;
  sumByTurnAndType(turnId: number, type: 'INGRESO' | 'EGRESO'): Promise<number>;
}
