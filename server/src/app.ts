import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { configurePassport } from '@infrastructure/auth/passport.config';
import authRoutes from '@infrastructure/http/routes/auth.routes';
import rbacRoutes from '@infrastructure/http/routes/role.routes';
import userRoutes from '@infrastructure/http/routes/user.routes';
import employeeRoutes from '@infrastructure/http/routes/employee.routes';
import branchRoutes from '@infrastructure/http/routes/branch.routes';
import profileRoutes from '@infrastructure/http/routes/profile.routes';
import { globalErrorHandler } from '@infrastructure/http/middlewares/error.middleware';
import brandRoutes from '@infrastructure/http/routes/brand.routes';
import clientRoutes from '@infrastructure/http/routes/client.routes';
import bannerRoutes from '@infrastructure/http/routes/banner.routes';
import productRoutes from '@infrastructure/http/routes/product.routes'; // HU-014 / HU-015
import ecommerceProductsRoutes from '@infrastructure/http/routes/ecommerce-products.routes';
import catalogRoutes from '@infrastructure/http/routes/catalog.routes';
import attributeRoutes from '@infrastructure/http/routes/attribute.routes';
import kardexRoutes from '@infrastructure/http/routes/kardex.routes';
import stockRoutes from '@infrastructure/http/routes/stock.routes';
import reportRoutes from '@infrastructure/http/routes/report.routes';
import supplierRoutes from '@infrastructure/http/routes/supplier.routes'; // HU-051
import stockAlertRoutes from '@infrastructure/http/routes/stock-alert.routes'; // HU-027
import inventoryAuditRoutes from '@infrastructure/http/routes/inventory-audit.routes'; // HU-029
import posRoutes from '@infrastructure/http/routes/pos.routes'; // HU-034
import cashTurnRoutes from '@infrastructure/http/routes/cash-turn.routes'; // HU-032
import cashRegisterRoutes from '@infrastructure/http/routes/cash-register.routes';
import posProductRoutes from '@infrastructure/http/routes/pos-product.routes';
import posClientRoutes from '@infrastructure/http/routes/pos-client.routes';
import wishlistRoutes from '@infrastructure/http/routes/wishlist.routes'; // HU-010
import posStockRoutes from '@infrastructure/http/routes/pos-stock.routes';
import stockTransferRoutes from '@infrastructure/http/routes/stock-transfer.routes';
import adminCrossBranchRoutes from '@infrastructure/http/routes/admin-cross-branch.routes';
import receiptRoutes from '@infrastructure/http/routes/receipt.routes';
import addressRoutes from '@infrastructure/http/routes/address.routes';
import blogRoutes from '@infrastructure/http/routes/blog.routes';
import adminDashboardRoutes from '@infrastructure/http/routes/admin-dashboard.routes';
import adminReconciliationRoutes from '@infrastructure/http/routes/admin-reconciliation.routes';
import genderRoutes from '@infrastructure/http/routes/gender.routes';
import adminExpenseRoutes from '@infrastructure/http/routes/admin-expense.routes';
import creditRoutes from '@infrastructure/http/routes/credit.routes';

import ecommerceCartRoutes from '@infrastructure/http/routes/ecommerce-cart.routes';
import deliveryZoneRoutes from '@infrastructure/http/routes/delivery-zone.routes';
import checkoutRoutes from '@infrastructure/http/routes/checkout.routes';
import couponRoutes from '@infrastructure/http/routes/coupon.routes';
import adminCouponsRoutes from '@infrastructure/http/routes/admin-coupons.routes';
import adminLoyaltyConfigRoutes from '@infrastructure/http/routes/admin-loyalty-config.routes';
import loyaltyRoutes from '@infrastructure/http/routes/loyalty.routes';
import npsRoutes from '@infrastructure/http/routes/nps.routes';
import adminAlertsRoutes from '@infrastructure/http/routes/admin-alerts.routes';
import orderRoutes from '@infrastructure/http/routes/order.routes';
import logisticsRoutes from '@infrastructure/http/routes/logistics.routes';
import returnsRoutes from '@infrastructure/http/routes/returns.routes';
import { requestContextMiddleware } from '@infrastructure/context/RequestContext';
import complaintRoutes from '@infrastructure/http/routes/complaint.routes';
import salesAnomalyRoutes from '@infrastructure/http/routes/sales-anomaly.routes';
import newsletterRoutes from '@infrastructure/http/routes/newsletter.routes';
import adminNewsletterRoutes from '@infrastructure/http/routes/admin-newsletter.routes';
import socialProofRoutes from '@infrastructure/http/routes/social-proof.routes';
import { adminSettingsRoutes } from '@infrastructure/http/routes/admin-settings.routes';
import adminBackupConfigRoutes from '@infrastructure/http/routes/admin-backup-config.routes';
import inventorySettingsRoutes from '@infrastructure/http/routes/inventorySettings.routes';

const app = express();

// Initialize Passport with Google OAuth strategy (HU-001 / T-032)
configurePassport();

// Middlewares
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true, // Allow cookies cross-origin for OAuth flow
  })
);
app.use(
  express.json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());
app.use(requestContextMiddleware);

// Health check endpoint para Docker
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rutas base (se expandirá con la arquitectura hexagonal)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', rbacRoutes);
app.use('/api/v1', userRoutes);
app.use('/api/v1', employeeRoutes);
app.use('/api/v1', branchRoutes);
app.use('/api/v1', profileRoutes);
app.use('/api/v1', brandRoutes);
app.use('/api/v1', clientRoutes);
app.use('/api/v1', bannerRoutes); // HU-019 Banners
app.use('/api/v1', productRoutes); // HU-014 — Variantes SKU / HU-015 — Inactivación Lógica
app.use('/api/v1', ecommerceProductsRoutes);
app.use('/api/v1', catalogRoutes);
app.use('/api/v1', attributeRoutes);
app.use('/api/v1', kardexRoutes);
app.use('/api/v1', stockRoutes);
app.use('/api/v1', reportRoutes);
app.use('/api/v1', supplierRoutes); // HU-051 — Gestión de Proveedores
app.use('/api/v1/stock-alerts', stockAlertRoutes); // HU-027 — Alertas de Stock Crítico
app.use('/api/v1', inventoryAuditRoutes); // HU-029 — Auditoría de Inventario Físico
app.use('/api/v1/pos', posRoutes); // HU-034 — Descuentos en el POS
app.use('/api/v1', cashTurnRoutes); // HU-032 — Apertura de Caja
app.use('/api/v1', cashRegisterRoutes);
app.use('/api/v1', posProductRoutes);
app.use('/api/v1', posClientRoutes);
app.use('/api/v1/wishlist', wishlistRoutes); // HU-010 — Wishlist
app.use('/api/v1/cart', ecommerceCartRoutes); // HU-041 — Carrito de Compras
app.use('/api/v1', posStockRoutes);
app.use('/api/v1', stockTransferRoutes);
app.use('/api/v1', adminCrossBranchRoutes);
app.use('/api/v1/admin', adminSettingsRoutes);
app.use('/api/v1', receiptRoutes);
app.use('/api/v1', addressRoutes);
app.use('/api/v1', blogRoutes);
app.use('/api/v1', adminDashboardRoutes);
app.use('/api/v1', adminReconciliationRoutes);
app.use('/api/v1', genderRoutes);
app.use('/api/v1', adminExpenseRoutes);
app.use('/api/v1', creditRoutes);

app.use('/api/v1', deliveryZoneRoutes);
app.use('/api/v1/checkout', checkoutRoutes);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/admin/coupons', adminCouponsRoutes);

// ...
app.use('/api/v1', orderRoutes);
app.use('/api/v1', logisticsRoutes);
app.use('/api/v1', returnsRoutes);
app.use('/api/v1', adminAlertsRoutes);
app.use('/api/v1/admin/loyalty-config', adminLoyaltyConfigRoutes);
app.use('/api/v1/admin/backup-config', adminBackupConfigRoutes);
app.use('/api/v1', inventorySettingsRoutes);
app.use('/api/v1/loyalty', loyaltyRoutes);
app.use('/api/v1/nps', npsRoutes); // HU-086 - NPS
app.use('/api/v1', complaintRoutes); // HU-084 — Libro de Reclamaciones Virtual
app.use('/api/v1', salesAnomalyRoutes); // HU-092 — Detección y Alerta de Anomalías en Ventas
app.use('/api/v1', newsletterRoutes);
app.use('/api/v1/admin/newsletter', adminNewsletterRoutes);
app.use('/api/v1/social-proof', socialProofRoutes);
app.get('/api', (_req: Request, res: Response) => {
  res.status(200).json({ message: 'Backend is running' });
});

// Error Handling (Must be after routes)
app.use(globalErrorHandler);

export default app;
