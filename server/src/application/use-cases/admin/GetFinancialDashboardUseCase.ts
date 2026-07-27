import { IOrderRepository } from '@domain/repositories/IOrderRepository';
import { IPosOrderRepository } from '@domain/repositories/IPosOrderRepository';
import {
  FinancialConsolidationService,
  FinancialSaleInput,
  FinancialDashboardSummary,
} from '@domain/services/FinancialConsolidationService';

export interface GetFinancialDashboardDTO {
  from?: string;
  to?: string;
}

export class GetFinancialDashboardUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly posOrderRepository: IPosOrderRepository,
    private readonly consolidationService: FinancialConsolidationService
  ) {}

  async execute(dto: GetFinancialDashboardDTO): Promise<FinancialDashboardSummary> {
    let fromDate: Date;
    let toDate: Date;

    const now = new Date();

    if (dto.from) {
      fromDate = new Date(dto.from);
      // Ensure it starts at 00:00:00
      fromDate.setHours(0, 0, 0, 0);
    } else {
      // Default: Last 30 days
      fromDate = new Date();
      fromDate.setDate(now.getDate() - 30);
      fromDate.setHours(0, 0, 0, 0);
    }

    if (dto.to) {
      toDate = new Date(dto.to);
      toDate.setHours(23, 59, 59, 999);
    } else {
      toDate = new Date();
      toDate.setHours(23, 59, 59, 999);
    }

    // Calculate comparative previous period
    const durationMs = toDate.getTime() - fromDate.getTime();
    const prevFromDate = new Date(fromDate.getTime() - durationMs - 1);
    const prevToDate = new Date(fromDate.getTime() - 1);

    // Fetch current period data in parallel
    const [currentOrders, currentPosOrders, prevOrders, prevPosOrders] = await Promise.all([
      this.orderRepository.getFinancialSales(fromDate, toDate),
      this.posOrderRepository.getFinancialSales(fromDate, toDate),
      this.orderRepository.getFinancialSales(prevFromDate, prevToDate),
      this.posOrderRepository.getFinancialSales(prevFromDate, prevToDate),
    ]);

    // Map to domain inputs
    const currentInputs: FinancialSaleInput[] = [
      ...currentOrders.map((o) => ({
        amount: o.amount,
        channel: 'ECOMMERCE' as const,
        branchId: null,
        branchName: 'Venta Online',
      })),
      ...currentPosOrders.map((p) => ({
        amount: p.amount,
        channel: 'POS' as const,
        branchId: p.branchId,
        branchName: p.branchName,
      })),
    ];

    const prevInputs: FinancialSaleInput[] = [
      ...prevOrders.map((o) => ({
        amount: o.amount,
        channel: 'ECOMMERCE' as const,
        branchId: null,
        branchName: 'Venta Online',
      })),
      ...prevPosOrders.map((p) => ({
        amount: p.amount,
        channel: 'POS' as const,
        branchId: p.branchId,
        branchName: p.branchName,
      })),
    ];

    return this.consolidationService.consolidate(currentInputs, prevInputs);
  }
}
