import { OperatingExpense, CreateOperatingExpenseDTO, UpdateOperatingExpenseDTO } from '../entities/OperatingExpense';

export interface IOperatingExpenseRepository {
  create(data: CreateOperatingExpenseDTO): Promise<OperatingExpense>;
  findById(id: number): Promise<OperatingExpense | null>;
  findAll(filters: { branchId?: number; from?: Date; to?: Date }): Promise<OperatingExpense[]>;
  update(id: number, data: UpdateOperatingExpenseDTO): Promise<OperatingExpense>;
  delete(id: number): Promise<void>;
}
