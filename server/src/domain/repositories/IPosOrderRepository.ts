export interface IPosOrderRepository {
  getSalesTotalInRange(start: Date, end: Date): Promise<number>;
  getSalesByBranchInRange(start: Date, end: Date): Promise<Array<{
    branchId: number;
    totalSales: number;
  }>>;
  findPosOrdersForExport(params: { from?: Date; to?: Date }): Promise<any[]>;
  getFinancialSales(from?: Date, to?: Date): Promise<Array<{
    amount: number;
    createdAt: Date;
    branchId: number;
    branchName: string;
  }>>;
}

