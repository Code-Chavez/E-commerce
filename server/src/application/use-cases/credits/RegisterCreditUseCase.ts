import { IClientCreditRepository } from '@domain/repositories/IClientCreditRepository';
import { IClientRepository } from '@domain/repositories/IClientRepository';
import { ClientCredit, validateCredit } from '@domain/entities/ClientCredit';
import { CreateCreditDTO } from '@application/dtos/CreditDTO';

export class RegisterCreditUseCase {
  constructor(
    private readonly creditRepository: IClientCreditRepository,
    private readonly clientRepository: IClientRepository
  ) {}

  async execute(dto: CreateCreditDTO): Promise<ClientCredit> {
    validateCredit({
      clientId: dto.clientId,
      totalAmount: dto.totalAmount,
      installments: dto.installments,
      dueDate: dto.dueDate,
    });

    const client = await this.clientRepository.findById(dto.clientId);
    if (!client) {
      throw new Error(`El cliente con ID ${dto.clientId} no existe`);
    }

    return this.creditRepository.create({
      clientId: dto.clientId,
      totalAmount: dto.totalAmount,
      installments: dto.installments,
      dueDate: dto.dueDate,
    });
  }
}
