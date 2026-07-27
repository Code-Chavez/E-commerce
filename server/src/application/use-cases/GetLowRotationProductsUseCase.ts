import { IReportRepository } from "../../domain/repositories/IReportRepository";
import { LowRotationProduct } from "../../domain/entities/LowRotationProduct";

export class GetLowRotationProductsUseCase {
  constructor(private reportRepository: IReportRepository) {}

  async execute(days: number): Promise<LowRotationProduct[]> {
    return this.reportRepository.getLowRotationProducts(days);
  }
}
