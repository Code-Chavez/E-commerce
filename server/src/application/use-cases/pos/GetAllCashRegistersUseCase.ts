import { ICashRegisterRepository, CashRegisterWithBranchName } from '@domain/repositories/ICashRegisterRepository';

export class GetAllCashRegistersUseCase {
  constructor(private readonly cashRegisterRepository: ICashRegisterRepository) {}

  async execute(): Promise<CashRegisterWithBranchName[]> {
    return this.cashRegisterRepository.findAll();
  }
}
