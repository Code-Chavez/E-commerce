import { Order } from '@domain/entities/Order';
import { User } from '@domain/entities/User';

export interface IReceiptPdfService {
  generateReceiptPdfStream(order: Order, user: User): Promise<NodeJS.ReadableStream>;
}
