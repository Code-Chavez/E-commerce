import { LocalOrderInfo } from '../models/ReconciliationResult';

export interface IOrderRepositoryPort {
  getOrdersByDateRange(from: Date, to: Date): Promise<LocalOrderInfo[]>;
}
