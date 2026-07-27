export interface IStockAlertRepository {
  getActiveAlertsWithQuantity(): Promise<Array<{
    sku: string;
    productName: string;
    branchName: string;
    currentStock: number;
    minStock: number;
  }>>;
}
