import { IClientCreditRepository } from '@domain/repositories/IClientCreditRepository';
import { CreditPayment } from '@domain/entities/CreditPayment';
import { calculatePendingBalance } from '@domain/entities/ClientCredit';
import { CreatePaymentDTO } from '@application/dtos/CreditDTO';

export class RegisterPaymentUseCase {
  constructor(private readonly creditRepository: IClientCreditRepository) {}

  async execute(creditId: string, dto: CreatePaymentDTO): Promise<CreditPayment> {
    if (dto.amount <= 0) {
      throw new Error('El monto del pago debe ser mayor a cero');
    }

    const credit = await this.creditRepository.findById(creditId);
    if (!credit) {
      throw new Error(`El crédito con ID ${creditId} no existe`);
    }

    const pendingBalance = calculatePendingBalance(credit);
    // Allow small floating point tolerances by using precise comparison
    const margin = 0.001;
    if (dto.amount > pendingBalance + margin) {
      throw new Error(`El monto del pago (${dto.amount}) supera el saldo pendiente (${pendingBalance})`);
    }

    return this.creditRepository.createPayment({
      creditId,
      amount: dto.amount,
    });
  }
}
