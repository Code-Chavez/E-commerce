import { CashRegister } from '../entities/CashTurn';

export interface CreateCashRegisterDTO {
  branchId: number;
  name: string;
}

export interface UpdateCashRegisterDTO {
  branchId?: number;
  name?: string;
}

export interface CashRegisterWithBranchName {
  id: number;
  branchId: number;
  name: string;
  branchName: string;
  createdAt: Date;
}

export interface ICashRegisterRepository {
  create(data: CreateCashRegisterDTO): Promise<CashRegister>;
  findAll(): Promise<CashRegisterWithBranchName[]>;
  findById(id: number): Promise<CashRegister | null>;
  update(id: number, data: UpdateCashRegisterDTO): Promise<CashRegister>;
  delete(id: number): Promise<void>;
  hasTurns(id: number): Promise<boolean>;
}
