import { IClientCreditRepository } from '@domain/repositories/IClientCreditRepository';
import { IClientRepository } from '@domain/repositories/IClientRepository';
import { calculatePendingBalance } from '@domain/entities/ClientCredit';

export interface ClientPendingBalanceDTO {
  clientId: number;
  totalPendingBalance: number;
  credits: {
    id: string;
    totalAmount: number;
    pendingBalance: number;
    dueDate: Date;
    installments: number;
  }[];
}

export class GetPendingBalanceUseCase {
  constructor(
    private readonly creditRepository: IClientCreditRepository,
    private readonly clientRepository: IClientRepository
  ) {}

  async execute(clientId: number): Promise<ClientPendingBalanceDTO> {
    const client = await this.clientRepository.findById(clientId);
    if (!client) {
      throw new Error(`El cliente con ID ${clientId} no existe`);
    }

    const credits = await this.creditRepository.findByClientId(clientId);
    
    let totalPendingBalance = 0;
    const creditDetails = credits.map((credit) => {
      const pendingBalance = calculatePendingBalance(credit);
      totalPendingBalance += pendingBalance;
      return {
        id: credit.id,
        totalAmount: Number(credit.totalAmount),
        pendingBalance,
        dueDate: credit.dueDate,
        installments: credit.installments,
      };
    });

    return {
      clientId,
      totalPendingBalance: Number(totalPendingBalance.toFixed(2)),
      credits: creditDetails,
    };
  }
}
