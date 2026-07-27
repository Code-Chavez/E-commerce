import { IOrderRepository } from '@domain/repositories/IOrderRepository';
import { Order } from '@domain/entities/Order';

interface ListAdminOrdersDTO {
  status?: string;
  from?: string;
  to?: string;
  cursor?: number;
  limit?: number;
  userId?: number;
}

export class ListAdminOrdersUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(dto: ListAdminOrdersDTO): Promise<{ orders: Order[]; nextCursor: number | null }> {
    const limit = dto.limit ? Number(dto.limit) : 20;
    
    let fromDate: Date | undefined;
    let toDate: Date | undefined;
    
    if (dto.from) {
      fromDate = new Date(dto.from);
    }
    
    if (dto.to) {
      toDate = new Date(dto.to);
      // Set to end of day if it's a date string without time
      if (dto.to.indexOf('T') === -1) {
        toDate.setHours(23, 59, 59, 999);
      }
    }

    return this.orderRepository.findAdminOrders({
      status: dto.status,
      from: fromDate,
      to: toDate,
      cursor: dto.cursor ? Number(dto.cursor) : undefined,
      limit,
      userId: dto.userId,
    });
  }
}
