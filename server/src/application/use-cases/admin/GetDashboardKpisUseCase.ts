import { IOrderRepository } from '@domain/repositories/IOrderRepository';
import { IPosOrderRepository } from '@domain/repositories/IPosOrderRepository';
import { IStockAlertRepository } from '@domain/repositories/IStockAlertRepository';
import { IBranchRepository } from '@domain/repositories/IBranchRepository';
import { DashboardKpiDto } from '@application/dtos/DashboardKpiDto';

export class GetDashboardKpisUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly posOrderRepository: IPosOrderRepository,
    private readonly stockAlertRepository: IStockAlertRepository,
    private readonly branchRepository: IBranchRepository
  ) {}

  async execute(): Promise<DashboardKpiDto> {
    // Calcular inicio y fin del día en la zona horaria de la operación (America/Lima - GMT-5)
    const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Lima' });
    const startOfDay = new Date(`${todayStr}T00:00:00-05:00`);
    const endOfDay = new Date(`${todayStr}T23:59:59.999-05:00`);

    // Ejecutar consultas en paralelo para mejorar el rendimiento
    const [
      posSalesTotal,
      ecommerceSalesTotal,
      pendingOrdersCount,
      criticalStockProducts,
      salesByBranchRaw,
      allBranches,
    ] = await Promise.all([
      this.posOrderRepository.getSalesTotalInRange(startOfDay, endOfDay),
      this.orderRepository.getSalesTotalInRange(startOfDay, endOfDay),
      this.orderRepository.countPending(),
      this.stockAlertRepository.getActiveAlertsWithQuantity(),
      this.posOrderRepository.getSalesByBranchInRange(startOfDay, endOfDay),
      this.branchRepository.findAll(),
    ]);

    // Filtrar sucursales activas y cruzar las ventas agrupadas correspondientes
    const activeBranches = allBranches.filter((b) => b.isActive);
    const salesByBranch = activeBranches.map((b) => {
      const found = salesByBranchRaw.find((s) => s.branchId === b.id);
      return {
        branchId: b.id,
        branchName: b.name,
        totalSales: found ? found.totalSales : 0,
      };
    });

    return {
      todaySales: {
        total: Number((posSalesTotal + ecommerceSalesTotal).toFixed(2)),
        pos: Number(posSalesTotal.toFixed(2)),
        ecommerce: Number(ecommerceSalesTotal.toFixed(2)),
      },
      pendingOrdersCount,
      criticalStock: {
        count: criticalStockProducts.length,
        products: criticalStockProducts,
      },
      salesByBranch,
    };
  }
}
