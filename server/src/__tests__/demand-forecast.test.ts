import { describe, it, expect } from '@jest/globals';
import { MovingAverageCalculator } from '../../src/domain/services/MovingAverageCalculator';
import { CalculateDemandForecastUseCase } from '../../src/application/use-cases/CalculateDemandForecastUseCase';
import { GenerateRestockSuggestionsUseCase } from '../../src/application/use-cases/GenerateRestockSuggestionsUseCase';
import {
  IDemandForecastRepository,
  VariantHistoricalData,
} from '../../src/domain/repositories/IDemandForecastRepository';

class MockDemandForecastRepository implements IDemandForecastRepository {
  constructor(private readonly mockData: VariantHistoricalData[]) {}
  async getVariantSalesAndStock(): Promise<VariantHistoricalData[]> {
    return this.mockData;
  }
}

describe('HU-091 demand forecast & restock suggestions tests', () => {
  describe('MovingAverageCalculator', () => {
    it('should calculate moving average correctly', () => {
      const avg = MovingAverageCalculator.calculate(15, 3);
      expect(avg).toBe(5);
    });

    it('should round to 2 decimal places', () => {
      const avg = MovingAverageCalculator.calculate(10, 3);
      expect(avg).toBe(3.33);
    });

    it('should return 0 when months <= 0', () => {
      const avg = MovingAverageCalculator.calculate(10, 0);
      expect(avg).toBe(0);
    });

    it('should handle division by zero or negative months gracefully', () => {
      const avg = MovingAverageCalculator.calculate(10, -5);
      expect(avg).toBe(0);
    });
  });

  describe('UseCases', () => {
    const mockData: VariantHistoricalData[] = [
      {
        variantId: 1,
        categoryName: 'Polos',
        size: 'M',
        totalSalesQty: 10,
        currentStock: 2,
      },
      {
        variantId: 2,
        categoryName: 'Polos',
        size: 'M',
        totalSalesQty: 5,
        currentStock: 4,
      },
      {
        variantId: 3,
        categoryName: 'Jeans',
        size: '32',
        totalSalesQty: 20,
        currentStock: 25,
      },
    ];

    it('CalculateDemandForecastUseCase groupings', async () => {
      const repo = new MockDemandForecastRepository(mockData);
      const useCase = new CalculateDemandForecastUseCase(repo);

      const result = await useCase.execute(2); // 2 months
      expect(result).toHaveLength(2);

      const polosM = result.find(
        (r) => r.categoryName === 'Polos' && r.size === 'M'
      );
      const jeans32 = result.find(
        (r) => r.categoryName === 'Jeans' && r.size === '32'
      );

      expect(polosM?.projectedDemand).toBe(7.5); // (10 + 5) / 2
      expect(jeans32?.projectedDemand).toBe(10); // 20 / 2
    });

    it('GenerateRestockSuggestionsUseCase logic', async () => {
      const repo = new MockDemandForecastRepository(mockData);
      const useCase = new GenerateRestockSuggestionsUseCase(repo);

      const result = await useCase.execute(1); // 1 month
      expect(result).toHaveLength(3);

      const v1 = result.find((r) => r.variantId === 1);
      const v2 = result.find((r) => r.variantId === 2);
      const v3 = result.find((r) => r.variantId === 3);

      expect(v1?.suggestedQty).toBe(8); // demand=10, stock=2, suggested=8
      expect(v2?.suggestedQty).toBe(1); // demand=5, stock=4, suggested=1
      expect(v3?.suggestedQty).toBe(0); // demand=20, stock=25, suggested=0 (not negative)
    });
  });
});
