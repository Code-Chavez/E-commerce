import { IOrderRepository } from '@domain/repositories/IOrderRepository';
import { ProfitabilityCalculatorService, ProfitabilitySummary } from '@domain/services/ProfitabilityCalculatorService';

export interface GetProfitabilityReportDTO {
  from?: string;
  to?: string;
  groupBy: 'brand' | 'category';
}

export class GetProfitabilityReportUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly profitabilityCalculator: ProfitabilityCalculatorService
  ) {}

  async execute(dto: GetProfitabilityReportDTO): Promise<ProfitabilitySummary> {
    let fromDate: Date | undefined;
    let toDate: Date | undefined;

    if (dto.from) {
      fromDate = new Date(dto.from);
    }

    if (dto.to) {
      toDate = new Date(dto.to);
      if (dto.to.indexOf('T') === -1) {
        toDate.setHours(23, 59, 59, 999);
      }
    }

    // Retrieve raw sales and matching kardex costs
    const data = await this.orderRepository.getProfitabilityData(fromDate, toDate);

    // Map database models to domain inputs for calculations
    const inputs = data.map((item) => ({
      name: dto.groupBy === 'brand' ? item.brandName : item.categoryName,
      qty: item.qty,
      salePrice: item.unitPrice,
      costPrice: item.unitCost,
    }));

    // Perform financial calculations in Domain Service
    return this.profitabilityCalculator.calculate(inputs);
  }
}
