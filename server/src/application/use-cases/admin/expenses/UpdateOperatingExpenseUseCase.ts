import { IOperatingExpenseRepository } from '@domain/repositories/IOperatingExpenseRepository';
import { UpdateOperatingExpenseDTO, OperatingExpense, validateOperatingExpense } from '@domain/entities/OperatingExpense';

export class UpdateOperatingExpenseUseCase {
  constructor(private readonly expenseRepository: IOperatingExpenseRepository) {}

  async execute(id: number, dto: UpdateOperatingExpenseDTO): Promise<OperatingExpense> {
    const existing = await this.expenseRepository.findById(id);
    if (!existing) {
      throw new Error(`Gasto operativo con ID ${id} no encontrado`);
    }

    // Merge existing values with updates to validate invariants on the final state
    const merged = {
      branchId: dto.branchId !== undefined ? dto.branchId : existing.branchId,
      type: dto.type !== undefined ? dto.type : existing.type,
      description: dto.description !== undefined ? dto.description : existing.description,
      amount: dto.amount !== undefined ? dto.amount : existing.amount,
      userId: existing.userId, // User ID cannot be modified after registration
    };

    validateOperatingExpense(merged);

    return this.expenseRepository.update(id, dto);
  }
}
