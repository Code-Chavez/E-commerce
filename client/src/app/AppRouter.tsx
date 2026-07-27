import { Routes, Route, Navigate } from 'react-router-dom';
import RegisterPage from '../features/ecommerce/auth/RegisterPage';
import VerifyPage from '../features/ecommerce/auth/VerifyPage';
import LoginPage from '../features/ecommerce/auth/LoginPage';
import ForgotPasswordPage from '../features/ecommerce/auth/ForgotPasswordPage';
import ResetPasswordPage from '../features/ecommerce/auth/ResetPasswordPage';
import GoogleAuthSuccessPage from '../features/ecommerce/auth/GoogleAuthSuccessPage';
import HomePage from '../features/ecommerce/HomePage';
import WishlistPage from '../features/ecommerce/WishlistPage';
import { CheckoutPage } from '@/features/ecommerce/CheckoutPage';
import { CheckoutSuccessPage } from '@/features/ecommerce/CheckoutSuccessPage';
import { OrdersPage } from '@/features/ecommerce/OrdersPage';
import CatalogPage from '../features/ecommerce/CatalogPage';
import ProductDetailPage from '../features/ecommerce/ProductDetailPage';
import UnauthorizedPage from '../features/admin/UnauthorizedPage';
import EmployeesPage from '../features/admin/EmployeesPage';
import BranchesPage from '../features/admin/branches/BranchesPage';
import BrandingPage from '../features/admin/BrandingPage';
import ClientLinkPage from '../features/admin/ClientLinkPage';
import ClientsPage from '../features/admin/ClientsPage';
import NewsletterAdminPage from '../features/admin/NewsletterAdminPage';
import BannersPage from '../features/admin/BannersPage';
import DeliveryZonesPage from '../features/admin/delivery-zones/DeliveryZonesPage';
import ProductsAdminPage from '../features/admin/ProductsAdminPage';
import DashboardPage from '../features/admin/DashboardPage';
import CreditNotesPage from '../features/admin/credit-notes/CreditNotesPage';
import ReconcilePage from '../features/admin/ReconcilePage';
import CreditControlPage from '../features/admin/CreditControlPage';
import { ProtectedRoute } from '../features/admin/components/ProtectedRoute';
import ProfilePage from '../features/ecommerce/profile/ProfilePage';
import { ProfileLayout } from '../features/ecommerce/profile/components/ProfileLayout';
import AddressesPage from '../features/ecommerce/profile/AddressesPage';
import ReturnRequestPage from '../features/ecommerce/profile/ReturnRequestPage';
import { AppShell } from '../components/layout/AppShell';
import { AdminShell } from '../components/layout/AdminShell';
import { PosShell } from '../components/layout/PosShell';
import CategoriesPage from '../features/admin/CategoriesPage';
import BrandsPage from '../features/admin/BrandsPage';
import GendersPage from '../features/admin/GendersPage';
import AttributesPage from '../features/admin/AttributesPage';
import ProductFormPage from '../features/admin/ProductFormPage';
import AdjustmentPage from '../features/admin/AdjustmentPage';
import TransferPage from '../features/admin/TransferPage';
import RotationReportPage from '../features/admin/RotationReportPage';
import LowRotationPage from '../features/admin/LowRotationPage';
import DemandForecastPage from '../features/admin/DemandForecastPage';
import SuppliersPage from '../features/admin/suppliers/SuppliersPage';
import StockEntriesPage from '../features/admin/entries/StockEntriesPage';
import StockPage from '../features/admin/stock/StockPage';
import InventoryAuditPage from '../features/admin/audits/InventoryAuditPage';
import CrossBranchMonitorPage from '../features/admin/stock/CrossBranchMonitorPage';
import ReceiptsPage from '../features/admin/ReceiptsPage';
import { PosProvider, PosGuard } from '../features/pos/context/PosContext';
import OpenCashPage from '../features/pos/OpenCashPage';
import CashRegistersPage from '../features/admin/branches/CashRegistersPage';
import PossScreen from '../features/pos/PossScreen';
import TurnSalesPage from '../features/pos/TurnSalesPage';
import CloseTurnPage from '../features/pos/CloseTurnPage';
import BlogAdminPage from '../features/admin/BlogAdminPage';
import BlogEditorPage from '../features/admin/BlogEditorPage';
import BlogListPage from '../features/ecommerce/BlogListPage';
import BlogPostPage from '../features/ecommerce/BlogPostPage';
import { AdminOrdersPage } from '../features/admin/components/AdminOrdersPage';
import { ReturnsAdminPage } from '../features/admin/returns/ReturnsAdminPage';
import PickingPage from '../features/admin/PickingPage';
import DeliveriesPage from '../features/admin/DeliveriesPage';
import DeliveriesByZonePage from '../features/admin/DeliveriesByZonePage';
import DispatchReportPage from '../features/admin/DispatchReportPage';
import ProfitabilityReportPage from '../features/admin/reports/profitability/ProfitabilityReportPage';
import { FinancialDashboardPage } from '../features/admin/reports/financial-dashboard/FinancialDashboardPage';
import ExpensesPage from '../features/admin/expenses/ExpensesPage';
import DiscountAuditPage from '../features/admin/DiscountAuditPage';
import SellerRankingPage from '../features/admin/SellerRankingPage';
import NPSSurveyPage from '../features/ecommerce/pages/NPSSurveyPage';
import InventoryValuationPage from '../features/admin/InventoryValuationPage';
import { CouponsAdminPage } from '../features/admin/coupons/CouponsAdminPage';
import RFMSegmentsPage from '../features/admin/RFMSegmentsPage';
import ComplaintsPage from '../features/ecommerce/ComplaintsPage';
import ComplaintsAdminPage from '../features/admin/ComplaintsAdminPage';
import { SocialProofAdminPage } from '../features/admin/pages/SocialProofAdminPage';
import { KardexPage } from '../features/admin/kardex/KardexPage';
import LoyaltyConfigPage from '../features/admin/LoyaltyConfigPage';
import { SystemSettingsPage } from '../features/admin/SystemSettingsPage';
import BackupConfigPage from '../features/admin/BackupConfigPage';

export const AppRouter = () => {
  return (
    <Routes>
      {/* Public / E-commerce Routes (wrapped in AppShell) */}
      <Route element={<AppShell />}>
        {/* Main Entry Point */}
        <Route path="/" element={<HomePage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/search" element={<Navigate to="/catalog" replace />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        
        {/* HU-018 Blog */}
        <Route path="/blog" element={<BlogListPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />

        {/* HU-086 NPS */}
        <Route path="/ecommerce/nps/:token" element={<NPSSurveyPage />} />

        {/* Public / Unprotected Routes */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Google OAuth Success Redirect (HU-001 / T-036) */}
        <Route path="/auth/google/success" element={<GoogleAuthSuccessPage />} />

        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SELLER', 'CLIENT']}>
              <ProfileLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ProfilePage />} />
          <Route path="addresses" element={<AddressesPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:orderId/return" element={<ReturnRequestPage />} />
          {/* HU-084 */}
          <Route path="complaints" element={<ComplaintsPage />} />
        </Route>
      </Route>

      {/* POS Routes with Cash Register Opening Shift verification (standalone container) */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'SELLER']}>
            <PosProvider>
              <PosShell />
            </PosProvider>
          </ProtectedRoute>
        }
      >
        <Route path="/pos/open-cash" element={<OpenCashPage />} />
        <Route
          path="/pos"
          element={
            <PosGuard>
              <PossScreen />
            </PosGuard>
          }
        />
        <Route
          path="/pos/turn/sales"
          element={
            <PosGuard>
              <TurnSalesPage />
            </PosGuard>
          }
        />
        <Route
          path="/pos/turn/close"
          element={
            <PosGuard>
              <CloseTurnPage />
            </PosGuard>
          }
        />
      </Route>

      {/* Administrative Routes (wrapped in AdminShell) */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SELLER']}><AdminShell /></ProtectedRoute>}>
        <Route
          path="/admin"
          element={<Navigate to="/admin/dashboard" replace />}
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/employees"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <EmployeesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/branding"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <BrandingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/delivery-zones"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <DeliveryZonesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/coupons"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <CouponsAdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/banners"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <BannersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/clients/link"
          element={
            <ProtectedRoute allowedPermissions={['users:write']}>
              <ClientLinkPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/clients"
          element={
            <ProtectedRoute allowedPermissions={['users:read']}>
              <ClientsPage />
            </ProtectedRoute>
          }
        />

        {/* HU-083 RFM Segmentation */}
        <Route
          path="/admin/clients/rfm-segments"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <RFMSegmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/credits"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <CreditControlPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <ProductsAdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/branches"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <BranchesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/branches/registers"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <CashRegistersPage />
            </ProtectedRoute>
          }
        />

        {/* HU-048 Admin Orders */}
        <Route path="/admin/orders" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminOrdersPage /></ProtectedRoute>} />
        <Route path="/admin/returns" element={<ProtectedRoute allowedRoles={['ADMIN']}><ReturnsAdminPage /></ProtectedRoute>} />

        {/* HU-073 Reconciliation */}
        <Route path="/admin/reconcile" element={<ProtectedRoute allowedRoles={['ADMIN']}><ReconcilePage /></ProtectedRoute>} />

        {/* HU-068 Credit Notes */}
        <Route path="/admin/credit-notes" element={<ProtectedRoute allowedRoles={['ADMIN']}><CreditNotesPage /></ProtectedRoute>} />

        {/* HU-011 */}
        <Route path="/admin/categories" element={<ProtectedRoute allowedRoles={['ADMIN']}><CategoriesPage /></ProtectedRoute>} />
        <Route path="/admin/brands" element={<ProtectedRoute allowedRoles={['ADMIN']}><BrandsPage /></ProtectedRoute>} />
        <Route path="/admin/genders" element={<ProtectedRoute allowedRoles={['ADMIN']}><GendersPage /></ProtectedRoute>} />

        {/* HU-018 Blog Management */}
        <Route path="/admin/blog" element={<ProtectedRoute allowedRoles={['ADMIN']}><BlogAdminPage /></ProtectedRoute>} />
        <Route path="/admin/blog/new" element={<ProtectedRoute allowedRoles={['ADMIN']}><BlogEditorPage /></ProtectedRoute>} />
        <Route path="/admin/blog/:id/edit" element={<ProtectedRoute allowedRoles={['ADMIN']}><BlogEditorPage /></ProtectedRoute>} />

        {/* HU-012 */}
        <Route path="/admin/attributes" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPPLY']}><AttributesPage /></ProtectedRoute>} />

        {/* HU-013 */}
        <Route path="/admin/products/new" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPPLY']}><ProductFormPage /></ProtectedRoute>} />
        <Route path="/admin/products/:id/edit" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPPLY']}><ProductFormPage /></ProtectedRoute>} />

        {/* HU-028 */}
        <Route path="/admin/inventory/adjustments" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPPLY']}><AdjustmentPage /></ProtectedRoute>} />

        {/* HU-024 */}
        <Route path="/admin/inventory/transfers" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPPLY']}><TransferPage /></ProtectedRoute>} />

        {/* HU-051 */}
        <Route path="/admin/inventory/suppliers" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPPLY']}><SuppliersPage /></ProtectedRoute>} />
        <Route path="/admin/inventory/entries" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPPLY']}><StockEntriesPage /></ProtectedRoute>} />

        {/* HU-021 */}
        <Route path="/admin/inventory/stock" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPPLY']}><StockPage /></ProtectedRoute>} />

        {/* HU-057 */}
        <Route path="/admin/inventory/cross-branch/pending" element={<ProtectedRoute allowedRoles={['ADMIN', 'SELLER', 'SUPPLY']}><CrossBranchMonitorPage /></ProtectedRoute>} />

        {/* HU-055 */}
        <Route path="/admin/receipts" element={<ProtectedRoute allowedRoles={['ADMIN', 'SELLER']}><ReceiptsPage /></ProtectedRoute>} />

        {/* HU-029 */}
        <Route path="/admin/inventory/audits" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPPLY']}><InventoryAuditPage /></ProtectedRoute>} />

        {/* HU-026 */}
        <Route path="/admin/inventory/kardex" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPPLY']}><KardexPage /></ProtectedRoute>} />

        {/* HU-030 */}
        <Route path="/admin/reports/inventory-rotation" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPPLY']}><RotationReportPage /></ProtectedRoute>} />
        <Route path="/admin/reports/low-rotation" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPPLY']}><LowRotationPage /></ProtectedRoute>} />
        <Route path="/admin/reports/demand-forecast" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPPLY']}><DemandForecastPage /></ProtectedRoute>} />

        {/* HU-077 */}
        <Route path="/admin/reports/inventory-valuation" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPPLY']}><InventoryValuationPage /></ProtectedRoute>} />

        {/* HU-069 Profitability Report */}
        <Route path="/admin/reports/profitability" element={<ProtectedRoute allowedRoles={['ADMIN']}><ProfitabilityReportPage /></ProtectedRoute>} />

        {/* HU-070 Financial Dashboard */}
        <Route path="/admin/reports/financial-dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><FinancialDashboardPage /></ProtectedRoute>} />
        <Route path="/admin/expenses" element={<ProtectedRoute allowedRoles={['ADMIN', 'SELLER']}><ExpensesPage /></ProtectedRoute>} />

        {/* HU-075 */}
        <Route path="/admin/reports/discounts" element={<ProtectedRoute allowedRoles={['ADMIN']}><DiscountAuditPage /></ProtectedRoute>} />

        {/* HU-076 */}
        <Route path="/admin/reports/seller-ranking" element={<ProtectedRoute allowedRoles={['ADMIN']}><SellerRankingPage /></ProtectedRoute>} />

        {/* HU-058 Logistics & Picking */}
        <Route path="/admin/logistics/picking" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPPLY']}><PickingPage /></ProtectedRoute>} />
        <Route path="/admin/logistics/deliveries" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPPLY']}><DeliveriesPage /></ProtectedRoute>} />
        <Route path="/admin/logistics/deliveries-by-zone" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPPLY']}><DeliveriesByZonePage /></ProtectedRoute>} />

        {/* HU-067 */}
        <Route path="/admin/reports/dispatch-efficiency" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPPLY']}><DispatchReportPage /></ProtectedRoute>} />

        {/* HU-084 Libro de Reclamaciones */}
        <Route path="/admin/complaints" element={<ProtectedRoute allowedRoles={['ADMIN']}><ComplaintsAdminPage /></ProtectedRoute>} />
        <Route path="/admin/social-proof" element={<ProtectedRoute allowedRoles={['ADMIN']}><SocialProofAdminPage /></ProtectedRoute>} />
        
        {/* HU-078 Loyalty Admin */}
        <Route path="/admin/loyalty-config" element={<ProtectedRoute allowedRoles={['ADMIN']}><LoyaltyConfigPage /></ProtectedRoute>} />

        {/* RSK-002 Backup Config */}
        <Route path="/admin/backup-config" element={<ProtectedRoute allowedRoles={['ADMIN']}><BackupConfigPage /></ProtectedRoute>} />

        {/* HU-088 Newsletter Admin */}
        <Route path="/admin/newsletter" element={<ProtectedRoute allowedRoles={['ADMIN']}><NewsletterAdminPage /></ProtectedRoute>} />

        {/* System Settings */}
        <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['ADMIN']}><SystemSettingsPage /></ProtectedRoute>} />

        {/* User Profile */}
        <Route path="/admin/profile" element={<ProtectedRoute allowedRoles={['ADMIN', 'SELLER', 'SUPPLY']}><ProfilePage /></ProtectedRoute>} />
      </Route>


      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
