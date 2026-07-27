import { IOperatingExpenseRepository } from '@domain/repositories/IOperatingExpenseRepository';

export class DeleteOperatingExpenseUseCase {
  constructor(private readonly expenseRepository: IOperatingExpenseRepository) {}

  async execute(id: number): Promise<void> {
    const existing = await this.expenseRepository.findById(id);
    if (!existing) {
      throw new Error(`Gasto operativo con ID ${id} no encontrado`);
    }

    await this.expenseRepository.delete(id);
  }
}
