import { LowRotationProduct } from "../entities/LowRotationProduct";

export interface IReportRepository {
  getLowRotationProducts(days: number): Promise<LowRotationProduct[]>;
}
