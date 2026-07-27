import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/shared/context/AuthContext';
import { useStockAlerts } from '@/features/admin/hooks/useStockAlerts';
import { useAutoReturnAlerts } from '@/features/admin/hooks/useAutoReturnAlerts';
import { useBrand } from '@/shared/context/BrandContext';
import { QuickRegisterModal } from '@/features/pos/components/QuickRegisterModal';
import axiosInstance from '@/shared/api/axiosInstance';
import { alertsService } from '@/shared/api/alertsService';
import { 
  Menu, 
  User, 
  LogOut, 
  Image as ImageIcon, 
  Palette, 
  Users, 
  ClipboardList,
  FileSignature,
  Bell,
  Boxes,
  ClipboardCheck,
  MapPin,
  ChevronDown,
  Archive,
  BarChart3,
  Store,
  Check,
  Building2,
  Package,
  FolderTree,
  Award,
  Sliders,
  UserPlus,
  Landmark,
  ArrowLeftRight,
  FileText,
  LayoutDashboard,
  Truck,
  BarChart2,
  Ticket,
  DollarSign,
  Tag,
  Trophy,
  PieChart,
  BookOpen,
  Camera,
  TrendingUp,
  Gift,
  Mail,
  Database,
  ScrollText
} from 'lucide-react';


interface AccordionMenuProps {
  menuKey: string;
  title: React.ReactNode;
  isExpanded: boolean;
  isCollapsed: boolean;
  onToggle: (key: string) => void;
  children: React.ReactNode;
}

const AccordionMenu: React.FC<AccordionMenuProps> = ({ 
  menuKey, 
  title, 
  isExpanded, 
  isCollapsed, 
  onToggle, 
  children 
}) => (
  <div className="space-y-1">
    {!isCollapsed ? (
      <button
        onClick={() => onToggle(menuKey)}
        className="w-full flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-[#FAFAFA]/40 px-3 py-1 hover:text-white transition-colors"
      >
        <span>{title}</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
    ) : (
      <p className="text-[10px] uppercase font-bold tracking-widest text-[#FAFAFA]/40 text-center">•</p>
    )}
        <div 
      className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
        isExpanded || isCollapsed ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      }`}
    >
      <div className="overflow-hidden">
        <div className="space-y-1 mt-1">
          {children}
        </div>
      </div>
    </div>
  </div>
);

export const AdminShell: React.FC = () => {
  const { user, logout } = useAuth();
  const { brandConfig } = useBrand();
  const navigate = useNavigate();
  const location = useLocation();

  // Sidebar states
  const [isCollapsed, setIsCollapsed] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    ventas: false,
    catalogo: false,
    inventario: false,
    crm: false,
    finanzas: false,
    empresa: false,
    logistica: false
  });

  // Header Dropdowns
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isAlertsDropdownOpen, setIsAlertsDropdownOpen] = useState(false);
  const [isClientRegisterOpen, setIsClientRegisterOpen] = useState(false);

  // Stock Alerts hook
  const { alerts, dismissAlert } = useStockAlerts();
  const { alerts: autoReturnAlerts, dismissAlert: dismissAutoReturn } = useAutoReturnAlerts();
  const activeAlertsCount = alerts.length + autoReturnAlerts.length;

  // Cross Branch count state
  const [pendingCrossBranchCount, setPendingCrossBranchCount] = useState(0);

  // Pending Logistics Alerts count
  const [pendingLogisticsAlertCount, setPendingLogisticsAlertCount] = useState(0);

  // Sales Anomalies count
  const [salesAnomalyCount, setSalesAnomalyCount] = useState(0);

  // Auto-expand based on route
  useEffect(() => {
    const path = location.pathname;
    let activeKey = '';
    
    if (path.startsWith('/admin/orders') || path.startsWith('/admin/returns') || path.startsWith('/admin/delivery-zones') || path.startsWith('/admin/banners') || path.startsWith('/admin/blog')) {
      activeKey = 'ventas';
    } else if (path.startsWith('/admin/products') || path.startsWith('/admin/categories') || path.startsWith('/admin/brands') || path.startsWith('/admin/genders') || path.startsWith('/admin/attributes')) {
      activeKey = 'catalogo';
    } else if (path.startsWith('/admin/inventory') || path.startsWith('/admin/reports/inventory-rotation') || path.startsWith('/admin/reports/low-rotation') || path.startsWith('/admin/reports/inventory-valuation') || path.startsWith('/admin/reports/demand-forecast')) {
      activeKey = 'inventario';
    } else if (path.startsWith('/admin/clients') || path.startsWith('/admin/complaints')) {
      activeKey = 'crm';
    } else if (path.startsWith('/admin/receipts') || path.startsWith('/admin/reconcile') || path.startsWith('/admin/branches/registers') || path.startsWith('/admin/credit-notes') || path.startsWith('/admin/reports/profitability') || path.startsWith('/admin/reports/financial-dashboard') || path.startsWith('/admin/expenses') || path.startsWith('/admin/credits') || path.startsWith('/admin/reports/discounts') || path.startsWith('/admin/reports/seller-ranking')) {
      activeKey = 'finanzas';
    } else if (path.startsWith('/admin/branches') || path.startsWith('/admin/employees') || path.startsWith('/admin/branding') || path.startsWith('/admin/loyalty-config') || path.startsWith('/admin/settings') || path.startsWith('/admin/backup-config')) {
      activeKey = 'empresa';
    } else if (path.startsWith('/admin/logistics') || path.startsWith('/admin/reports/dispatch-efficiency')) {
      activeKey = 'logistica';
    }
    
    if (activeKey) {
      setExpandedMenus({
        ventas: false,
        catalogo: false,
        inventario: false,
        crm: false,
        finanzas: false,
        empresa: false,
        logistica: false,
        [activeKey]: true
      });
    }
  }, [location.pathname]);

  useEffect(() => {
    const fetchPendingCrossBranch = async () => {
      try {
        const { data } = await axiosInstance.get('/v1/admin/cross-branch/pending');
        if (data.success) {
          const list = data.data || [];
          const count = list.reduce((acc: number, item: any) => acc + (item.pendingOrdersCount || 0), 0);
          setPendingCrossBranchCount(count);
        }
      } catch (err) {
        console.error('Error fetching pending cross branch count:', err);
      }
    };
    fetchPendingCrossBranch();
    
    // Poll every 60 seconds
    const interval = setInterval(fetchPendingCrossBranch, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchPendingLogistics = async () => {
      try {
        if (user?.role === 'ADMIN' || user?.role === 'SUPPLY') {
          const response = await alertsService.getPendingOrdersAlerts();
          if (response.success) {
            setPendingLogisticsAlertCount(response.count);
          }
        }
      } catch (err) {
        console.error('Error fetching pending logistics alerts:', err);
      }
    };
    fetchPendingLogistics();
    
    // Poll every 5 minutes (300000 ms)
    const interval = setInterval(fetchPendingLogistics, 300000);
    return () => clearInterval(interval);
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    const fetchAnomalies = async () => {
      try {
        const { data } = await axiosInstance.get('/v1/admin/sales-anomalies', { params: { onlyActive: 'true' } });
        setSalesAnomalyCount((data.data ?? []).length);
      } catch {
        // silent
      }
    };
    fetchAnomalies();
    const interval = setInterval(fetchAnomalies, 300000);
    return () => clearInterval(interval);
  }, [user?.role]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = (menuKey: string) => {
    setExpandedMenus(prev => {
      const isCurrentlyOpen = prev[menuKey];
      return {
        ventas: false,
        catalogo: false,
        inventario: false,
        crm: false,
        finanzas: false,
        empresa: false,
        logistica: false,
        [menuKey]: !isCurrentlyOpen
      };
    });
  };

  const isActiveRoute = (path: string) => {
    if (path === '/admin/inventory/stock' || path === '/admin/logistics/deliveries') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const activeClass = "bg-[#3F3F3F] text-white";
  const inactiveClass = "text-[#FAFAFA]/75 hover:bg-[#3F3F3F]/40 hover:text-white";

  return (
    <div className="flex h-screen bg-[#F9F9F6] font-sans selection:bg-[#3F3F3F] selection:text-white overflow-hidden">
      
      {/* 1. SIDEBAR LATERAL */}
      <aside 
        className={`bg-[#1e1e1a] text-[#FAFAFA] flex flex-col transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        } shrink-0 border-r border-[#D9D9D2]/10`}
      >
        {/* Top Branding/Logo Area */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#D9D9D2]/10 bg-[#151512]">
          {!isCollapsed ? (
            <Link to="/admin/inventory/stock" className="flex items-center gap-2 overflow-hidden">
              {brandConfig?.logoHorizontalUrl ? (
                <img src={brandConfig.logoHorizontalUrl} alt="Logo" className="h-8 brightness-[10] object-contain" />
              ) : (
                <span className="text-[#FAFAFA] font-bold text-sm truncate max-w-[120px]">{brandConfig?.brandName || "E-Commerce"}</span>
              )}
              <span className="text-[10px] bg-[#3F3F3F] text-[#FAFAFA] font-extrabold px-1.5 py-0.5 rounded tracking-widest uppercase shrink-0">Admin</span>
            </Link>
          ) : (
            <div className="mx-auto text-center font-extrabold text-white text-lg tracking-widest bg-[#3F3F3F] h-8 w-8 rounded-lg flex items-center justify-center">
              {brandConfig?.brandName ? brandConfig.brandName.charAt(0).toUpperCase() : "D'"}
            </div>
          )}
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Grupo 1: Principal */}
          <div className="space-y-1">
            <p className={`text-[10px] uppercase font-bold tracking-widest text-[#FAFAFA]/40 px-3 ${isCollapsed ? 'text-center' : ''}`}>
              {!isCollapsed ? 'Principal' : '•'}
            </p>
            <Link
              to="/admin/dashboard"
              className={`flex items-center justify-between gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                isActiveRoute('/admin/dashboard') || location.pathname === '/admin' ? activeClass : inactiveClass
              } ${isCollapsed ? 'justify-center' : ''}`}
              title="Dashboard"
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>Dashboard</span>}
              </div>
              {!isCollapsed && salesAnomalyCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-orange-500 rounded-full animate-pulse">
                  {salesAnomalyCount}
                </span>
              )}
            </Link>
            {(user?.role === 'ADMIN' || user?.role === 'SELLER') && (
              <Link
                to="/pos"
                className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                  isActiveRoute('/pos') ? activeClass : inactiveClass
                } ${isCollapsed ? 'justify-center' : ''}`}
                title="Punto de Venta (POS)"
              >
                <Store className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>Punto de Venta (POS)</span>}
              </Link>
            )}
          </div>

          {/* Grupo 2: Ventas & E-commerce */}
          {(user?.role === 'ADMIN' || user?.role === 'SELLER') && (
          <AccordionMenu 
            menuKey="ventas" 
            title="Ventas & E-commerce" 
            isExpanded={expandedMenus.ventas} 
            isCollapsed={isCollapsed} 
            onToggle={toggleMenu}
          >
            <Link
              to="/admin/orders"
              className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                isActiveRoute('/admin/orders') ? activeClass : inactiveClass
              } ${isCollapsed ? 'justify-center' : ''}`}
              title="Pedidos E-commerce"
            >
              <Package className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Pedidos E-commerce</span>}
            </Link>
            <Link
              to="/admin/returns"
              className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                isActiveRoute('/admin/returns') ? activeClass : inactiveClass
              } ${isCollapsed ? 'justify-center' : ''}`}
              title="Devoluciones"
            >
              <ArrowLeftRight className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Devoluciones</span>}
            </Link>
            {user?.role === 'ADMIN' && (
              <>
                <Link
                  to="/admin/delivery-zones"
                  className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                    isActiveRoute('/admin/delivery-zones') ? activeClass : inactiveClass
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title="Zonas de Envío"
                >
                  <MapPin className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span>Zonas de Envío</span>}
                </Link>
                <Link
                  to="/admin/banners"
                  className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                    isActiveRoute('/admin/banners') ? activeClass : inactiveClass
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title="Banners"
                >
                  <ImageIcon className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span>Banners</span>}
                </Link>
                <Link
                  to="/admin/blog"
                  className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                    isActiveRoute('/admin/blog') ? activeClass : inactiveClass
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title="Gestión del Blog"
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span>Gestión del Blog</span>}
                </Link>
              </>
            )}
          </AccordionMenu>
          )}

          {/* Grupo 3: Catálogo */}
          {(user?.role === 'ADMIN' || user?.role === 'SUPPLY') && (
          <AccordionMenu 
            menuKey="catalogo" 
            title="Catálogo" 
            isExpanded={expandedMenus.catalogo} 
            isCollapsed={isCollapsed} 
            onToggle={toggleMenu}
          >
            <Link
              to="/admin/products"
              className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                isActiveRoute('/admin/products') ? activeClass : inactiveClass
              } ${isCollapsed ? 'justify-center' : ''}`}
              title="Productos"
            >
              <Package className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Productos</span>}
            </Link>
            <Link
              to="/admin/categories"
              className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                isActiveRoute('/admin/categories') ? activeClass : inactiveClass
              } ${isCollapsed ? 'justify-center' : ''}`}
              title="Categorías"
            >
              <FolderTree className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Categorías</span>}
            </Link>
            <Link
              to="/admin/brands"
              className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                isActiveRoute('/admin/brands') ? activeClass : inactiveClass
              } ${isCollapsed ? 'justify-center' : ''}`}
              title="Marcas"
            >
              <Award className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Marcas</span>}
            </Link>
            <Link
              to="/admin/genders"
              className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                isActiveRoute('/admin/genders') ? activeClass : inactiveClass
              } ${isCollapsed ? 'justify-center' : ''}`}
              title="Géneros (Público Objetivo)"
            >
              <Users className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Géneros</span>}
            </Link>
            <Link
              to="/admin/attributes"
              className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                isActiveRoute('/admin/attributes') ? activeClass : inactiveClass
              } ${isCollapsed ? 'justify-center' : ''}`}
              title="Atributos"
            >
              <Sliders className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Atributos</span>}
            </Link>
          </AccordionMenu>
          )}

          {/* Grupo 4: Inventario */}
          {(user?.role === 'ADMIN' || user?.role === 'SUPPLY' || user?.role === 'SELLER') && (
          <AccordionMenu 
            menuKey="inventario" 
            title="Inventario" 
            isExpanded={expandedMenus.inventario} 
            isCollapsed={isCollapsed} 
            onToggle={toggleMenu}
          >
            {(user?.role === 'ADMIN' || user?.role === 'SUPPLY') && (
              <>
                <Link
                  to="/admin/inventory/stock"
                  className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                    isActiveRoute('/admin/inventory/stock') ? activeClass : inactiveClass
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title="Control de Stock"
                >
                  <Boxes className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span>Control de Stock</span>}
                </Link>
                <Link
                  to="/admin/inventory/suppliers"
                  className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                    isActiveRoute('/admin/inventory/suppliers') ? activeClass : inactiveClass
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title="Proveedores"
                >
                  <ClipboardList className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span>Proveedores</span>}
                </Link>
                <Link
                  to="/admin/inventory/entries"
                  className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                    isActiveRoute('/admin/inventory/entries') ? activeClass : inactiveClass
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title="Ingreso Mercadería"
                >
                  <FileSignature className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span>Ingreso Mercadería</span>}
                </Link>
                <Link
                  to="/admin/inventory/audits"
                  className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                    isActiveRoute('/admin/inventory/audits') ? activeClass : inactiveClass
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title="Auditoría Física"
                >
                  <ClipboardCheck className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span>Auditoría Física</span>}
                </Link>
                <Link
                  to="/admin/inventory/kardex"
                  className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                    isActiveRoute('/admin/inventory/kardex') ? activeClass : inactiveClass
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title="Kardex — Historial de Valorización"
                >
                  <ScrollText className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span>Kardex</span>}
                </Link>
                <Link
                  to="/admin/inventory/adjustments"
                  className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                    isActiveRoute('/admin/inventory/adjustments') ? activeClass : inactiveClass
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title="Ajustes de Stock"
                >
                  <Archive className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span>Ajustes de Stock</span>}
                </Link>
                <Link
                  to="/admin/inventory/transfers"
                  className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                    isActiveRoute('/admin/inventory/transfers') ? activeClass : inactiveClass
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title="Transferencias"
                >
                  <ArrowLeftRight className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span>Transferencias</span>}
                </Link>
              </>
            )}
            <Link
              to="/admin/inventory/cross-branch/pending"
              className={`flex items-center justify-between gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                isActiveRoute('/admin/inventory/cross-branch/pending') ? activeClass : inactiveClass
              } ${isCollapsed ? 'justify-center' : ''}`}
              title="Monitoreo Cross-Branch"
            >
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>Ventas Intersucursal</span>}
              </div>
              {!isCollapsed && pendingCrossBranchCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-indigo-600 rounded-full animate-pulse">
                  {pendingCrossBranchCount}
                </span>
              )}
            </Link>
            {(user?.role === 'ADMIN' || user?.role === 'SUPPLY') && (
              <>
                <Link
                  to="/admin/reports/inventory-rotation"
                  className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                    isActiveRoute('/admin/reports/inventory-rotation') ? activeClass : inactiveClass
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title="Rotación de Stock"
                >
                  <BarChart3 className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span>Rotación de Stock</span>}
                </Link>
                <Link
                  to="/admin/reports/low-rotation"
                  className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                    isActiveRoute('/admin/reports/low-rotation') ? activeClass : inactiveClass
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title="Baja Rotación"
                >
                  <BarChart3 className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span>Baja Rotación</span>}
                </Link>
                <Link
                  to="/admin/reports/demand-forecast"
                  className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                    isActiveRoute('/admin/reports/demand-forecast') ? activeClass : inactiveClass
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title="Predicción de Demanda"
                >
                  <TrendingUp className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span>Predicción de Demanda</span>}
                </Link>
                <Link
                  to="/admin/reports/inventory-valuation"
                  className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                    isActiveRoute('/admin/reports/inventory-valuation') ? activeClass : inactiveClass
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title="Valorización de Inventario"
                >
                  <Boxes className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span>Valorización</span>}
                </Link>
              </>
            )}
          </AccordionMenu>
          )}

          {/* Grupo 5: CRM */}
          {(user?.role === 'ADMIN' || user?.role === 'SELLER') && (
          <AccordionMenu 
            menuKey="crm" 
            title="CRM" 
            isExpanded={expandedMenus.crm} 
            isCollapsed={isCollapsed} 
            onToggle={toggleMenu}
          >
            <Link
              to="/admin/clients"
              className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                isActiveRoute('/admin/clients') && location.pathname === '/admin/clients' ? activeClass : inactiveClass
              } ${isCollapsed ? 'justify-center' : ''}`}
              title="Base de Clientes"
            >
              <Users className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Base de Clientes</span>}
            </Link>
            <Link
              to="/admin/clients/link"
              className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                isActiveRoute('/admin/clients/link') ? activeClass : inactiveClass
              } ${isCollapsed ? 'justify-center' : ''}`}
              title="Vincular Clientes"
            >
              <UserPlus className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Vincular Clientes</span>}
            </Link>
            <Link
              to="/admin/social-proof"
              className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                isActiveRoute('/admin/social-proof') ? activeClass : inactiveClass
              } ${isCollapsed ? 'justify-center' : ''}`}
              title="Galería Social Proof"
            >
              <Camera className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Galería Social Proof</span>}
            </Link>
            <Link
              to="/admin/clients/rfm-segments"
              className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                isActiveRoute('/admin/clients/rfm-segments') ? activeClass : inactiveClass
              } ${isCollapsed ? 'justify-center' : ''}`}
              title="Segmentación RFM"
            >
              <PieChart className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Segmentación RFM</span>}
            </Link>
            <Link
              to="/admin/complaints"
              className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                isActiveRoute('/admin/complaints') ? activeClass : inactiveClass
              } ${isCollapsed ? 'justify-center' : ''}`}
              title="Libro de Reclamaciones"
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Reclamaciones</span>}
            </Link>
            {user?.role === 'ADMIN' && (
              <Link
                to="/admin/newsletter"
                className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                  isActiveRoute('/admin/newsletter') ? activeClass : inactiveClass
                } ${isCollapsed ? 'justify-center' : ''}`}
                title="Newsletter"
              >
                <Mail className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>Newsletter</span>}
              </Link>
            )}
          </AccordionMenu>
          )}

          {/* Grupo 6: Finanzas */}
          {(user?.role === 'ADMIN' || user?.role === 'SELLER') && (
          <AccordionMenu 
            menuKey="finanzas" 
            title="Finanzas" 
            isExpanded={expandedMenus.finanzas} 
            isCollapsed={isCollapsed} 
            onToggle={toggleMenu}
          >
            <Link
              to="/admin/receipts"
              className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                isActiveRoute('/admin/receipts') ? activeClass : inactiveClass
              } ${isCollapsed ? 'justify-center' : ''}`}
              title="Comprobantes Electrónicos"
            >
              <FileText className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Comprobantes</span>}
            </Link>
            <Link
              to="/admin/reconcile"
              className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                isActiveRoute('/admin/reconcile') ? activeClass : inactiveClass
              } ${isCollapsed ? 'justify-center' : ''}`}
              title="Conciliación"
            >
              <ArrowLeftRight className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Conciliación</span>}
            </Link>
            <Link
              to="/admin/branches/registers"
              className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                isActiveRoute('/admin/branches/registers') ? activeClass : inactiveClass
              } ${isCollapsed ? 'justify-center' : ''}`}
              title="Gestión de Cajas"
            >
              <Landmark className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Gestión de Cajas</span>}
            </Link>
            <Link
              to="/admin/credit-notes"
              className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                isActiveRoute('/admin/credit-notes') ? activeClass : inactiveClass
              } ${isCollapsed ? 'justify-center' : ''}`}
              title="Notas de Crédito"
            >
              <Ticket className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Notas de Crédito</span>}
            </Link>
            <Link
              to="/admin/reports/profitability"
              className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                isActiveRoute('/admin/reports/profitability') ? activeClass : inactiveClass
              } ${isCollapsed ? 'justify-center' : ''}`}
              title="Reporte de Rentabilidad"
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Rentabilidad</span>}
            </Link>
            <Link
              to="/admin/reports/financial-dashboard"
              className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                isActiveRoute('/admin/reports/financial-dashboard') ? activeClass : inactiveClass
              } ${isCollapsed ? 'justify-center' : ''}`}
              title="Dashboard Financiero"
            >
              <BarChart2 className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Dashboard Financiero</span>}
            </Link>
            <Link
              to="/admin/expenses"
              className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                isActiveRoute('/admin/expenses') ? activeClass : inactiveClass
              } ${isCollapsed ? 'justify-center' : ''}`}
              title="Gastos Operativos"
            >
              <DollarSign className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Gastos Operativos</span>}
            </Link>
            <Link
              to="/admin/credits"
              className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                isActiveRoute('/admin/credits') ? activeClass : inactiveClass
              } ${isCollapsed ? 'justify-center' : ''}`}
              title="Cuentas por Cobrar y Créditos"
            >
              <Landmark className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Control de Créditos</span>}
            </Link>
            <Link
              to="/admin/reports/discounts"
              className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                isActiveRoute('/admin/reports/discounts') ? activeClass : inactiveClass
              } ${isCollapsed ? 'justify-center' : ''}`}
              title="Auditoría de Descuentos POS"
            >
              <Tag className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Auditoría de Descuentos</span>}
            </Link>
            <Link
              to="/admin/reports/seller-ranking"
              className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                isActiveRoute('/admin/reports/seller-ranking') ? activeClass : inactiveClass
              } ${isCollapsed ? 'justify-center' : ''}`}
              title="Ranking de Vendedores"
            >
              <Trophy className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Ranking de Vendedores</span>}
            </Link>
          </AccordionMenu>
          )}

          {/* Grupo 7: Empresa / Configuración */}
          {user?.role === 'ADMIN' && (
          <AccordionMenu 
            menuKey="empresa" 
            title="Empresa / Config." 
            isExpanded={expandedMenus.empresa} 
            isCollapsed={isCollapsed} 
            onToggle={toggleMenu}
          >
            <Link
              to="/admin/branches"
              className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                isActiveRoute('/admin/branches') && location.pathname === '/admin/branches' ? activeClass : inactiveClass
              } ${isCollapsed ? 'justify-center' : ''}`}
              title="Sucursales y Almacén"
            >
              <Building2 className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Sucursales y Almacén</span>}
            </Link>
            <Link
              to="/admin/employees"
              className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                isActiveRoute('/admin/employees') ? activeClass : inactiveClass
              } ${isCollapsed ? 'justify-center' : ''}`}
              title="Empleados"
            >
              <Users className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Empleados</span>}
            </Link>
            <Link
              to="/admin/branding"
              className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                isActiveRoute('/admin/branding') ? activeClass : inactiveClass
              } ${isCollapsed ? 'justify-center' : ''}`}
              title="Identidad Visual"
            >
              <Palette className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Identidad Visual</span>}
            </Link>
            <Link
              to="/admin/loyalty-config"
              className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                isActiveRoute('/admin/loyalty-config') ? activeClass : inactiveClass
              } ${isCollapsed ? 'justify-center' : ''}`}
              title="Reglas de Lealtad"
            >
              <Gift className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Reglas de Lealtad</span>}
            </Link>
            <Link
              to="/admin/settings"
              className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                isActiveRoute('/admin/settings') ? activeClass : inactiveClass
              } ${isCollapsed ? 'justify-center' : ''}`}
              title="Parámetros del Sistema"
            >
              <Sliders className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Parámetros del Sistema</span>}
            </Link>
            <Link
              to="/admin/backup-config"
              className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                isActiveRoute('/admin/backup-config') ? activeClass : inactiveClass
              } ${isCollapsed ? 'justify-center' : ''}`}
              title="Configuración de Backups"
            >
              <Database className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Configuración Backups</span>}
            </Link>
          </AccordionMenu>
          )}

          {/* Grupo 8: Logística */}
          {(user?.role === 'ADMIN' || user?.role === 'SUPPLY') && (
          <AccordionMenu 
            menuKey="logistica" 
            title={
              <div className="flex items-center gap-2">
                Logística
                {pendingLogisticsAlertCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                    {pendingLogisticsAlertCount}
                  </span>
                )}
              </div>
            }
            isExpanded={expandedMenus.logistica} 
            isCollapsed={isCollapsed} 
            onToggle={toggleMenu}
          >
            <Link
              to="/admin/logistics/picking"
              className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                isActiveRoute('/admin/logistics/picking') ? activeClass : inactiveClass
              } ${isCollapsed ? 'justify-center' : ''}`}
              title="Generar Picking"
            >
              <ClipboardCheck className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Generar Picking</span>}
            </Link>
             <Link
              to="/admin/logistics/deliveries"
              className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                isActiveRoute('/admin/logistics/deliveries') ? activeClass : inactiveClass
              } ${isCollapsed ? 'justify-center' : ''}`}
              title="Control de Despachos"
            >
              <Truck className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Control de Despachos</span>}
            </Link>
            <Link
              to="/admin/logistics/deliveries-by-zone"
              className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                isActiveRoute('/admin/logistics/deliveries-by-zone') ? activeClass : inactiveClass
              } ${isCollapsed ? 'justify-center' : ''}`}
              title="Despachos por Zona"
            >
              <MapPin className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Despachos por Zona</span>}
            </Link>
            <Link
              to="/admin/reports/dispatch-efficiency"
              className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                isActiveRoute('/admin/reports/dispatch-efficiency') ? activeClass : inactiveClass
              } ${isCollapsed ? 'justify-center' : ''}`}
              title="Eficiencia de Despacho"
            >
              <BarChart2 className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Eficiencia de Despacho</span>}
            </Link>
          </AccordionMenu>
          )}

        </nav>
      </aside>

      {/* 2. AREA DE CONTENIDO (HEADER + MAIN) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* HEADER SUPERIOR */}
        <header className="h-16 border-b border-[#D9D9D2]/40 bg-white flex items-center justify-between px-6 shrink-0 shadow-sm z-30">
          
          {/* Left: Hamburger sidebar toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-[#3F3F3F] hover:bg-[#FAFAFA] transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Right: Notifications, store link, Profile dropdown */}
          <div className="flex items-center gap-4">
            
            {/* Storefront Access Button */}
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D9D9D2] hover:bg-[#FAFAFA] text-xs font-bold text-[#3F3F3F] transition-all"
              title="Ir a Tienda Pública"
            >
              <Store className="w-4 h-4" />
              <span className="hidden sm:inline">Ver Tienda</span>
            </Link>

            {/* Quick Client Register Button (HU-007 Admin Extension) */}
            <button
              onClick={() => setIsClientRegisterOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D9D9D2] hover:bg-[#FAFAFA] hover:border-[#3F3F3F] text-xs font-bold text-[#3F3F3F] transition-all cursor-pointer"
              title="Registrar Cliente Rápido"
            >
              <UserPlus className="w-4 h-4 text-[#3F3F3F]" />
              <span className="hidden md:inline">Alta Rápida Cliente</span>
            </button>

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsAlertsDropdownOpen(!isAlertsDropdownOpen);
                  setIsUserDropdownOpen(false);
                }}
                className="relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-[#FAFAFA] border border-transparent hover:border-[#D9D9D2]/30 transition-colors"
                title="Alertas de Stock"
              >
                <Bell className="w-5 h-5 text-[#3F3F3F]" />
                {activeAlertsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full animate-bounce">
                    {activeAlertsCount}
                  </span>
                )}
              </button>

              {/* Alerts Dropdown List */}
              {isAlertsDropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-80 bg-white border border-[#D9D9D2]/40 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="p-4 border-b border-[#D9D9D2]/40 bg-[#FAFAFA] flex items-center justify-between">
                    <span className="text-xs font-bold text-[#3F3F3F] uppercase tracking-wider">Alertas ({activeAlertsCount})</span>
                    <button
                      onClick={() => setIsAlertsDropdownOpen(false)}
                      className="text-[#6B6B6B] hover:text-[#3F3F3F] text-xs"
                    >
                      Cerrar
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {/* Sección: Stock Crítico */}
                    <div className="px-3 pt-2 pb-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-red-500">Stock Crítico ({alerts.length})</span>
                    </div>
                    <div className="divide-y divide-[#D9D9D2]/20">
                      {alerts.length === 0 ? (
                        <div className="px-4 py-2 text-[10px] text-[#6B6B6B] italic">Sin alertas de stock crítico.</div>
                      ) : (
                        alerts.map((alert) => (
                          <div key={alert.id} className="p-3.5 hover:bg-[#FAFAFA]/50 transition-colors flex justify-between items-start gap-3">
                            <div className="min-w-0">
                              <span className="block font-bold text-xs text-[#3F3F3F] truncate">{alert.variant.sku}</span>
                              <span className="block text-[10px] text-[#6B6B6B] truncate mt-0.5">{alert.variant.product.name}</span>
                              <span className="inline-block text-[9px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200/50 mt-1">
                                Crítico en {alert.branch.name}
                              </span>
                            </div>
                            <button
                              onClick={() => dismissAlert(alert.id)}
                              className="p-1 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 shrink-0 transition-colors"
                              title="Descartar alerta"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Sección: Devoluciones Automáticas */}
                    <div className="px-3 pt-3 pb-1 border-t border-[#D9D9D2]/30">
                      <span className="text-[9px] font-black uppercase tracking-widest text-amber-600">Devoluciones Automáticas ({autoReturnAlerts.length})</span>
                    </div>
                    <div className="divide-y divide-[#D9D9D2]/20">
                      {autoReturnAlerts.length === 0 ? (
                        <div className="px-4 py-2 text-[10px] text-[#6B6B6B] italic">Sin devoluciones automáticas pendientes.</div>
                      ) : (
                        autoReturnAlerts.map((alert) => (
                          <div key={alert.id} className="p-3.5 hover:bg-[#FAFAFA]/50 transition-colors flex justify-between items-start gap-3">
                            <div className="min-w-0">
                              <span className="block font-bold text-xs text-[#3F3F3F]">Pedido #{alert.orderId}</span>
                              <span className="block text-[10px] text-[#6B6B6B] mt-0.5 truncate">
                                {alert.order.user?.name ?? alert.order.user?.email ?? 'Cliente'}
                              </span>
                              <span className="inline-block text-[9px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/50 mt-1">
                                {alert.productCount} ud. devueltas · ventana {alert.windowHours}h expiró
                              </span>
                              <span className="block text-[9px] text-gray-400 mt-0.5">
                                {new Date(alert.autoReturnedAt).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                              </span>
                            </div>
                            <button
                              onClick={() => dismissAutoReturn(alert.id)}
                              className="p-1 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 shrink-0 transition-colors"
                              title="Descartar"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {activeAlertsCount === 0 && (
                      <div className="p-6 text-center text-xs text-[#6B6B6B]">
                        No hay alertas activas en este momento.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown Toggle */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsUserDropdownOpen(!isUserDropdownOpen);
                  setIsAlertsDropdownOpen(false);
                }}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-[#FAFAFA] border border-transparent hover:border-[#D9D9D2]/30 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-[#3F3F3F] flex items-center justify-center text-[#FAFAFA] font-bold text-xs">
                  {user?.email?.charAt(0).toUpperCase() || 'A'}
                </div>
                <span className="hidden md:inline text-xs font-semibold text-[#3F3F3F] truncate max-w-[120px]">
                  {user?.email}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#6B6B6B]" />
              </button>

              {/* User Dropdown Menu */}
              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-52 bg-white border border-[#D9D9D2]/40 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="p-3 border-b border-[#D9D9D2]/40 bg-[#FAFAFA]">
                    <span className="block text-xs font-extrabold text-[#3F3F3F] truncate">{user?.email}</span>
                    <span className="block text-[10px] text-[#6B6B6B] mt-0.5 uppercase tracking-wider font-semibold">
                      {user?.role || 'Personal'}
                    </span>
                  </div>

                  <div className="p-1.5 space-y-0.5">
                    <Link
                      to="/admin/profile"
                      onClick={() => setIsUserDropdownOpen(false)}
                      className="w-full flex items-center gap-2 text-left p-2.5 hover:bg-[#FAFAFA] text-xs font-bold text-[#3F3F3F] rounded-lg transition-colors"
                    >

                      <User className="w-4 h-4 text-[#6B6B6B]" />
                      <span>Mi Perfil</span>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 text-left p-2.5 hover:bg-red-50 hover:text-red-700 text-xs font-bold text-[#3F3F3F] rounded-lg transition-colors border-t border-[#D9D9D2]/20 mt-1"
                    >
                      <LogOut className="w-4 h-4 text-red-500 shrink-0" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </header>

        {/* MAIN CONTAINER FOR OUTLET */}
        <main className="flex-grow overflow-y-auto p-1 bg-[#F9F9F6]">
          <Outlet />
        </main>

      </div>

      {/* Quick Client Register Modal (HU-007 Admin Extension) */}
      <QuickRegisterModal
        isOpen={isClientRegisterOpen}
        onClose={() => setIsClientRegisterOpen(false)}
      />

    </div>
  );
};

export default AdminShell;
