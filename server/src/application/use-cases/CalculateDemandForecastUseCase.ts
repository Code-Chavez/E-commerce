import { IDemandForecastRepository } from '@domain/repositories/IDemandForecastRepository';
import { DemandForecast } from '@domain/entities/DemandForecast';
import { MovingAverageCalculator } from '@domain/services/MovingAverageCalculator';

export class CalculateDemandForecastUseCase {
  constructor(private readonly repository: IDemandForecastRepository) {}

  async execute(months: number): Promise<DemandForecast[]> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const data = await this.repository.getVariantSalesAndStock(startDate);

    // Group sales by category and size
    const groups: Record<
      string,
      { categoryName: string; size: string; totalSalesQty: number }
    > = {};

    for (const item of data) {
      const key = `${item.categoryName}_${item.size}`;
      if (!groups[key]) {
        groups[key] = {
          categoryName: item.categoryName,
          size: item.size,
          totalSalesQty: 0,
        };
      }
      groups[key].totalSalesQty += item.totalSalesQty;
    }

    // Map to DemandForecast using MovingAverageCalculator
    return Object.values(groups).map((g) => ({
      categoryName: g.categoryName,
      size: g.size,
      projectedDemand: MovingAverageCalculator.calculate(
        g.totalSalesQty,
        months
      ),
    }));
  }
}
