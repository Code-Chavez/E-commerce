import { IBranchStockRepository, StockFilter, StockGroupedResult } from '@domain/repositories/IBranchStockRepository';

export class GetStockReportUseCase {
  constructor(private readonly branchStockRepository: IBranchStockRepository) {}

  async execute(filter: StockFilter): Promise<StockGroupedResult[]> {
    return this.branchStockRepository.getStockReport(filter);
  }
}
