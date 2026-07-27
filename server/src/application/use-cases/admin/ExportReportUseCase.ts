import { IOrderRepository } from '@domain/repositories/IOrderRepository';
import { IPosOrderRepository } from '@domain/repositories/IPosOrderRepository';
import { IClientRepository } from '@domain/repositories/IClientRepository';
import { IBranchStockRepository } from '@domain/repositories/IBranchStockRepository';
import { IExcelReportService } from '@domain/services/IExcelReportService';
import { IPdfReportService } from '@domain/services/IPdfReportService';

export class ExportReportUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly posOrderRepository: IPosOrderRepository,
    private readonly clientRepository: IClientRepository,
    private readonly branchStockRepository: IBranchStockRepository,
    private readonly excelReportService: IExcelReportService,
    private readonly pdfReportService: IPdfReportService
  ) {}

  async execute(params: {
    type: 'sales' | 'inventory' | 'clients';
    format: 'pdf' | 'excel' | 'csv';
    from?: string;
    to?: string;
  }): Promise<NodeJS.ReadableStream> {
    const fromDate = params.from ? new Date(`${params.from}T00:00:00-05:00`) : undefined;
    const toDate = params.to ? new Date(`${params.to}T23:59:59.999-05:00`) : undefined;

    if (params.type === 'sales') {
      const [ecommerceOrders, posOrders] = await Promise.all([
        this.orderRepository.findOrdersForExport({ from: fromDate, to: toDate }),
        this.posOrderRepository.findPosOrdersForExport({ from: fromDate, to: toDate }),
      ]);

      const ecommerceSales = ecommerceOrders.map((o) => {
        const u = o.user as any;
        return {
          id: `E-${o.id}`,
          createdAt: o.createdAt,
          source: 'E-COMMERCE',
          clientName: u ? `${u.name || ''} ${u.lastName || ''}`.trim() : '-',
          clientEmail: u?.email || '-',
          subtotal: o.total - o.shippingCost,
          discount: 0,
          shipping: o.shippingCost,
          total: o.total,
          status: o.status,
        };
      });

      const posSales = posOrders.map((po) => ({
        id: `P-${po.id}`,
        createdAt: po.createdAt,
        source: `POS (${po.branchName})`,
        clientName: '-',
        clientEmail: '-',
        subtotal: po.subtotal,
        discount: po.discountTotal,
        shipping: 0,
        total: po.total,
        status: po.status,
      }));

      const allSales = [...ecommerceSales, ...posSales].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );

      if (params.format === 'pdf') {
        return this.pdfReportService.generateSalesReport(allSales);
      } else {
        return this.excelReportService.generateSalesReport(allSales, params.format);
      }
    } else if (params.type === 'inventory') {
      const stockResults = await this.branchStockRepository.getStockReport({});

      const stockRows: any[] = [];
      for (const item of stockResults) {
        for (const bs of item.byBranch) {
          stockRows.push({
            variantId: item.variantId,
            sku: item.sku,
            productName: item.productName,
            branchName: bs.branchName,
            quantity: bs.quantity,
            status: bs.quantity > 0 ? 'DISPONIBLE' : 'SIN STOCK',
          });
        }
      }

      if (params.format === 'pdf') {
        return this.pdfReportService.generateInventoryReport(stockRows);
      } else {
        return this.excelReportService.generateInventoryReport(stockRows, params.format);
      }
    } else {
      const clients = await this.clientRepository.findForExport({ from: fromDate, to: toDate });

      if (params.format === 'pdf') {
        return this.pdfReportService.generateClientsReport(clients);
      } else {
        return this.excelReportService.generateClientsReport(clients, params.format);
      }
    }
  }
}
