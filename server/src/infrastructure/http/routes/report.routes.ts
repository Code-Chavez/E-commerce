import { Router } from 'express';
import { InventoryReportController } from '@infrastructure/http/controllers/InventoryReportController';
import { ReportController } from '@infrastructure/http/controllers/ReportController';
import { DispatchReportController } from '@infrastructure/http/controllers/DispatchReportController';
import { GetProfitabilityReportController } from '@infrastructure/http/controllers/GetProfitabilityReportController';
import { GetFinancialDashboardController } from '@infrastructure/http/controllers/GetFinancialDashboardController';
import { DiscountAuditController } from '@infrastructure/http/controllers/DiscountAuditController';
import { SellerRankingController } from '@infrastructure/http/controllers/SellerRankingController';
import { InventoryValuationController } from '@infrastructure/http/controllers/InventoryValuationController';
import { requirePermission } from '@infrastructure/http/middlewares/auth.middleware';

const router = Router();
const ctrl = new InventoryReportController();
const reportController = new ReportController();
const dispatchReportController = new DispatchReportController();
const profitabilityController = new GetProfitabilityReportController();
const financialDashboardController = new GetFinancialDashboardController();
const discountAuditController = new DiscountAuditController();
const sellerRankingController = new SellerRankingController();
const inventoryValuationController = new InventoryValuationController();

router.get(
  '/reports/inventory-rotation',
  requirePermission('products:read'),
  ctrl.inventoryRotation.bind(ctrl)
);

/**
 * T-207: Export reports in standard formats (PDF, Excel, CSV)
 */
router.get(
  '/reports/export',
  requirePermission('sales:read'),
  reportController.exportReport.bind(reportController)
);

// T-232: Reporte de eficiencia del proceso de despacho (HU-067)
router.get(
  '/reports/dispatch-efficiency',
  requirePermission('sales:read'),
  dispatchReportController.getEfficiency
);

// T-240: Reporte de utilidad bruta y rentabilidad por marca y categoría (HU-069)
router.get(
  '/admin/reports/profitability',
  requirePermission('sales:read'),
  profitabilityController.getReport.bind(profitabilityController)
);

// T-242: Dashboard Financiero Consolidado Multi-canal (HU-070)
router.get(
  '/admin/reports/financial-dashboard',
  requirePermission('sales:read'),
  financialDashboardController.getDashboard.bind(financialDashboardController)
);

// T-249: Reporte de Productos con Baja Rotación (HU-074)
router.get(
  '/admin/reports/low-rotation',
  requirePermission('products:read'), // Assuming 'products:read' or 'sales:read', let's use 'products:read'
  reportController.getLowRotationProducts.bind(reportController)
);

// T-248: Reporte de auditoría de descuentos aplicados en el POS (HU-075)
router.get(
  '/admin/reports/discounts',
  requirePermission('sales:read'),
  discountAuditController.getDiscountAudit
);

// T-250: Ranking de vendedores por desempeño (HU-076)
router.get(
  '/admin/reports/seller-ranking',
  requirePermission('sales:read'),
  sellerRankingController.getRanking
);

// T-252: Valorización del inventario en tiempo real (HU-077)
router.get(
  '/admin/reports/inventory-valuation',
  requirePermission('products:read'),
  inventoryValuationController.getValuation
);

// T-287 / HU-091: Modelo de Predicción de Demanda
router.get(
  '/admin/reports/demand-forecast',
  requirePermission('products:read'),
  reportController.getDemandForecast.bind(reportController)
);

// T-288 / HU-091: Sugerencias de Abastecimiento
router.get(
  '/admin/reports/restock-suggestions',
  requirePermission('products:read'),
  reportController.getRestockSuggestions.bind(reportController)
);

export default router;
