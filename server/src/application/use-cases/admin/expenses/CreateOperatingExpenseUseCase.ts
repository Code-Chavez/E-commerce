import { IOperatingExpenseRepository } from '@domain/repositories/IOperatingExpenseRepository';
import { CreateOperatingExpenseDTO, OperatingExpense, validateOperatingExpense } from '@domain/entities/OperatingExpense';

export class CreateOperatingExpenseUseCase {
  constructor(private readonly expenseRepository: IOperatingExpenseRepository) {}

  async execute(dto: CreateOperatingExpenseDTO): Promise<OperatingExpense> {
    // Validate domain invariants
    validateOperatingExpense({
      amount: dto.amount,
      type: dto.type,
      description: dto.description,
      branchId: dto.branchId,
      userId: dto.userId,
    });

    return this.expenseRepository.create(dto);
  }
}
