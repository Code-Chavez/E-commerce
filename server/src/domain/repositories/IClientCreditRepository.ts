import { ClientCredit } from '../entities/ClientCredit';
import { CreditPayment } from '../entities/CreditPayment';

export interface IClientCreditRepository {
  create(data: {
    clientId: number;
    totalAmount: number;
    installments: number;
    dueDate: Date;
  }): Promise<ClientCredit>;
  findById(id: string): Promise<ClientCredit | null>;
  findByClientId(clientId: number): Promise<ClientCredit[]>;
  createPayment(data: {
    creditId: string;
    amount: number;
  }): Promise<CreditPayment>;
}
