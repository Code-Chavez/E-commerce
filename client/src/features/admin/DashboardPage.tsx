import React, { useState, useEffect } from 'react';
import { useDashboardKpis } from './hooks/useDashboardKpis';
import axiosInstance from '@/shared/api/axiosInstance';
import { KpiCard } from './components/KpiCard';
import { BranchSalesChart } from './components/BranchSalesChart';
import { CriticalStockAlertsList } from './components/CriticalStockAlertsList';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { salesAnomalyService, type SalesAnomaly } from './services/salesAnomaly.service';
import { toast } from 'react-hot-toast';
import {
  Loader2,
  TrendingUp,
  Clock,
  AlertTriangle,
  RefreshCw,
  LayoutDashboard,
  TrendingDown,
  ChevronDown,
  CheckCircle,
} from 'lucide-react';

const DirectionBadge: React.FC<{ direction: 'HIGH' | 'LOW' }> = ({ direction }) => (
  direction === 'HIGH'
    ? <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
        <TrendingUp className="w-3 h-3" /> Alta
      </span>
    : <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
        <TrendingDown className="w-3 h-3" /> Baja
      </span>
);

export const DashboardPage: React.FC = () => {
  useDocumentTitle('Dashboard - E-Commerce');
  const { kpis, loading, error, refresh } = useDashboardKpis();

  const [anomalies, setAnomalies] = useState<SalesAnomaly[]>([]);
  const [anomalyLoading, setAnomalyLoading] = useState(true);
  const [anomalyExpanded, setAnomalyExpanded] = useState(false);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [globalMinStock, setGlobalMinStock] = useState<number>(10);

  useEffect(() => {
    axiosInstance.get('/v1/admin/settings').then(res => {
      const minStockSetting = res.data.find((s: any) => s.key === 'MIN_STOCK_ALERT');
      if (minStockSetting && minStockSetting.value) {
        setGlobalMinStock(parseInt(minStockSetting.value, 10));
      }
    }).catch(() => {});
  }, []);

  const loadAnomalies = async () => {
    setAnomalyLoading(true);
    try {
      const data = await salesAnomalyService.getActive();
      setAnomalies(data);
      if (data.length > 0) setAnomalyExpanded(true);
    } catch {
      // silent
    } finally {
      setAnomalyLoading(false);
    }
  };

  useEffect(() => { loadAnomalies(); }, []);

  const handleResolve = async (id: number) => {
    setResolvingId(id);
    try {
      await salesAnomalyService.resolve(id);
      setAnomalies(prev => prev.filter(a => a.id !== id));
      toast.success('Anomalía marcada como resuelta');
    } catch {
      toast.error('Error al resolver la anomalía');
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-accent/10 text-brand-accent flex items-center justify-center shrink-0">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-brand-accent tracking-tight">Dashboard de Analíticas</h2>
            <p className="text-xs text-brand-text mt-0.5">Monitoreo en tiempo real de ventas, pedidos e inventario crítico.</p>
          </div>
        </div>

        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 border border-gray-200 hover:border-black rounded-xl text-xs font-bold text-gray-700 hover:text-black bg-white transition shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-accent' : ''}`} />
          <span>Actualizar Datos</span>
        </button>
      </div>

      {loading && !kpis ? (
        <div className="flex justify-center items-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <Loader2 className="w-10 h-10 animate-spin text-brand-accent" />
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-3xl text-center text-red-800 text-sm font-semibold shadow-sm">
          {error}
        </div>
      ) : kpis ? (
        <div className="space-y-6">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KpiCard
              title="Ventas del Día"
              value={`S/ ${kpis.todaySales.total.toFixed(2)}`}
              icon={TrendingUp}
              breakdown={[
                { label: 'POS', value: `S/ ${kpis.todaySales.pos.toFixed(2)}` },
                { label: 'E-commerce', value: `S/ ${kpis.todaySales.ecommerce.toFixed(2)}` }
              ]}
              iconColorClass="bg-emerald-50 text-emerald-600"
            />

            <KpiCard
              title="Pedidos Pendientes"
              value={`${kpis.pendingOrdersCount} pedido${kpis.pendingOrdersCount === 1 ? '' : 's'}`}
              icon={Clock}
              breakdown={[
                { label: 'Por despachar', value: kpis.pendingOrdersCount }
              ]}
              iconColorClass="bg-blue-50 text-blue-600"
            />

            <KpiCard
              title="Stock Crítico"
              value={`${kpis.criticalStock.count} variante${kpis.criticalStock.count === 1 ? '' : 's'}`}
              icon={AlertTriangle}
              colorClass={kpis.criticalStock.count > 0 ? 'text-red-600' : 'text-gray-900'}
              iconColorClass={kpis.criticalStock.count > 0 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}
              breakdown={[
                { label: `≤ ${globalMinStock} unid. o var. config`, value: kpis.criticalStock.count }
              ]}
            />
          </div>

          {/* Charts & Alerts Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <BranchSalesChart data={kpis.salesByBranch} />
            </div>
            <div className="lg:col-span-2">
              <CriticalStockAlertsList products={kpis.criticalStock.products} />
            </div>
          </div>
        </div>
      ) : null}

      {/* Panel Anomalías de Ventas */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={() => setAnomalyExpanded(!anomalyExpanded)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${anomalies.length > 0 ? 'bg-orange-50 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
              <TrendingDown className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-extrabold text-gray-800">Anomalías de Ventas</h3>
              <p className="text-xs text-gray-400 mt-0.5">Desviaciones &gt; 2σ detectadas por el job diario</p>
            </div>
            {anomalies.length > 0 && (
              <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 animate-pulse">
                {anomalies.length} activa{anomalies.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${anomalyExpanded ? 'rotate-180' : ''}`} />
        </button>

        <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${anomalyExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
          <div className="overflow-hidden">
            <div className="border-t border-gray-100">
              {anomalyLoading ? (
                <div className="flex items-center justify-center py-10 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                  <span className="text-xs text-gray-500 font-semibold">Cargando anomalías...</span>
                </div>
              ) : anomalies.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                  <p className="text-sm font-bold text-gray-500">Sin anomalías activas</p>
                  <p className="text-xs text-gray-400">Las ventas están dentro de parámetros normales.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                        <th className="px-4 py-3 text-left">Producto</th>
                        <th className="px-4 py-3 text-left">Sucursal</th>
                        <th className="px-4 py-3 text-left">Fecha</th>
                        <th className="px-4 py-3 text-right">Ventas día</th>
                        <th className="px-4 py-3 text-right">Promedio 30d</th>
                        <th className="px-4 py-3 text-right">σ detectadas</th>
                        <th className="px-4 py-3 text-center">Dirección</th>
                        <th className="px-4 py-3 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {anomalies.map((a) => (
                        <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-gray-800 max-w-[150px] truncate" title={a.productName}>
                            {a.productName}
                          </td>
                          <td className="px-4 py-3 text-gray-500">{a.branchName}</td>
                          <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                            {new Date(a.date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-gray-800">
                            S/ {a.actualSales.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-500">
                            S/ {a.avgSales.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-orange-600">
                            {a.sigmas.toFixed(2)}σ
                          </td>
                          <td className="px-4 py-3 text-center">
                            <DirectionBadge direction={a.direction} />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleResolve(a.id)}
                              disabled={resolvingId === a.id}
                              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-all text-xs disabled:opacity-50 mx-auto"
                            >
                              {resolvingId === a.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                              Resolver
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DashboardPage;
