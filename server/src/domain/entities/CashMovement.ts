export type CashMovementType = 'INGRESO' | 'EGRESO';

export interface CashMovement {
  id?: number;
  turnId: number;
  type: CashMovementType;
  amount: number;
  reason: string;
  createdAt?: Date;
}
