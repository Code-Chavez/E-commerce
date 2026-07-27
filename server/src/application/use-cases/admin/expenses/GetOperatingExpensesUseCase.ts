import { IOperatingExpenseRepository } from '@domain/repositories/IOperatingExpenseRepository';
import { OperatingExpense } from '@domain/entities/OperatingExpense';

export interface GetOperatingExpensesFilter {
  branchId?: number;
  from?: Date;
  to?: Date;
}

export class GetOperatingExpensesUseCase {
  constructor(private readonly expenseRepository: IOperatingExpenseRepository) {}

  async execute(filters: GetOperatingExpensesFilter): Promise<OperatingExpense[]> {
    return this.expenseRepository.findAll(filters);
  }
}
