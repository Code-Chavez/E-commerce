import { Order, OrderStatus } from '@domain/entities/Order';

export interface IOrderRepository {
  findById(id: number): Promise<Order | null>;
  updateStatus(id: number, status: OrderStatus): Promise<Order>;
  findByPaymentIntentId(paymentIntentId: string): Promise<Order | null>;
  createOrderWithTransaction(
    orderData: {
      userId: number;
      status: string;
      total: number;
      shippingCost: number;
      addressSnapshot: any;
      paymentIntentId: string;
    },
    items: Array<{
      variantId: number;
      qty: number;
      unitPrice: number;
    }>
  ): Promise<Order>;
  findByUserId(
    userId: number,
    params: {
      status?: string;
      skip: number;
      take: number;
    }
  ): Promise<{ orders: Order[]; totalCount: number }>;
  findAdminOrders(params: {
    status?: string;
    from?: Date;
    to?: Date;
    cursor?: number;
    limit: number;
    userId?: number;
  }): Promise<{ orders: Order[]; nextCursor: number | null }>;
  getSalesTotalInRange(start: Date, end: Date): Promise<number>;
  countPending(): Promise<number>;
  findOrdersForExport(params: { from?: Date; to?: Date }): Promise<Order[]>;
  getProfitabilityData(from?: Date, to?: Date): Promise<Array<{
    qty: number;
    unitPrice: number;
    variantId: number;
    brandName: string;
    categoryName: string;
    orderCreatedAt: Date;
    unitCost: number;
  }>>;
  getFinancialSales(from?: Date, to?: Date): Promise<Array<{
    amount: number;
    createdAt: Date;
  }>>;
}


