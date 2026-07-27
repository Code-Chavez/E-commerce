import React, { useState } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import {
  Loader2, Calendar, TrendingUp, TrendingDown, Clock, Package,
  CheckCircle, XCircle, Users, BarChart2,
} from 'lucide-react';

interface DriverStat {
  deliveryManId: number;
  name: string;
  total: number;
  delivered: number;
  failed: number;
  successRate: number;
  avgDeliveryMinutes: number | null;
}

interface ReportData {
  totalDeliveries: number;
  delivered: number;
  failed: number;
  successRate: number;
  failureRate: number;
  avgDeliveryMinutes: number | null;
  byDriver: DriverStat[];
}

function formatMinutes(mins: number | null): string {
  if (mins === null) return '—';
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function successColor(rate: number): string {
  if (rate >= 80) return 'bg-emerald-500';
  if (rate >= 50) return 'bg-amber-400';
  return 'bg-red-500';
}

function successTextColor(rate: number): string {
  if (rate >= 80) return 'text-emerald-700';
  if (rate >= 50) return 'text-amber-700';
  return 'text-red-700';
}

const DispatchReportPage: React.FC = () => {
  useDocumentTitle("Eficiencia de Despacho — D'Mendoza");

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!from || !to) { toast.error('Selecciona el rango de fechas'); return; }
    if (new Date(from) > new Date(to)) { toast.error('La fecha inicio no puede ser mayor a la fecha fin'); return; }
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/v1/reports/dispatch-efficiency', {
        params: { from: new Date(from).toISOString(), to: new Date(to).toISOString() },
      });
      setReport(data.data);
      if (data.data.totalDeliveries === 0) toast('Sin despachos en el período seleccionado', { icon: 'ℹ️' });
    } catch {
      toast.error('Error al generar el reporte de eficiencia');
    } finally {
      setLoading(false);
    }
  };

  const kpis = report ? [
    {
      label: 'Total Despachos',
      value: report.totalDeliveries,
      icon: Package,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      label: 'Tasa de Éxito',
      value: `${report.successRate}%`,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Tasa de Fallo',
      value: `${report.failureRate}%`,
      icon: TrendingDown,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      label: 'Tiempo Promedio',
      value: formatMinutes(report.avgDeliveryMinutes),
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ] : [];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="border-b border-gray-100 pb-5">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Logística</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Eficiencia de Despacho</h1>
        <p className="text-sm text-gray-500 mt-1">
          Tiempo promedio de entrega, tasas de éxito/fallo y rendimiento por repartidor en el período seleccionado.
        </p>
      </div>

      {/* Filtros */}
      <form onSubmit={handleGenerate} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="space-y-1 flex-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Desde</label>
            <div className="relative">
              <input
                type="date"
                value={from}
                onChange={e => setFrom(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none"
              />
              <Calendar className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
            </div>
          </div>
          <div className="space-y-1 flex-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Hasta</label>
            <div className="relative">
              <input
                type="date"
                value={to}
                onChange={e => setTo(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none"
              />
              <Calendar className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2 shrink-0"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BarChart2 className="w-3.5 h-3.5" />}
            Generar Reporte
          </button>
        </div>
      </form>

      {/* KPIs */}
      {report && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {kpis.map(kpi => (
              <div key={kpi.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center shrink-0`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{kpi.label}</p>
                  <p className="text-xl font-extrabold text-gray-900">{kpi.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Resumen entregados/fallidos */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Entregados</p>
                <p className="text-2xl font-extrabold text-emerald-800">{report.delivered}</p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-500 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Fallidos</p>
                <p className="text-2xl font-extrabold text-red-800">{report.failed}</p>
              </div>
            </div>
          </div>

          {/* Tabla por repartidor */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-extrabold text-gray-900">Rendimiento por Repartidor</h2>
              <span className="ml-auto text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {report.byDriver.length} repartidor{report.byDriver.length !== 1 ? 'es' : ''}
              </span>
            </div>

            {report.byDriver.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-400 font-semibold">
                Sin despachos asignados a repartidores en este período.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Repartidor</th>
                      <th className="px-5 py-3 text-center">Total</th>
                      <th className="px-5 py-3 text-center">Entregados</th>
                      <th className="px-5 py-3 text-center">Fallidos</th>
                      <th className="px-5 py-3 text-center">T. Promedio</th>
                      <th className="px-5 py-3">Tasa de Éxito</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {report.byDriver.map(driver => (
                      <tr key={driver.deliveryManId} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 font-black text-xs flex items-center justify-center shrink-0">
                              {driver.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-gray-900">{driver.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center font-bold text-gray-700">{driver.total}</td>
                        <td className="px-5 py-4 text-center">
                          <span className="font-bold text-emerald-700">{driver.delivered}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="font-bold text-red-600">{driver.failed}</span>
                        </td>
                        <td className="px-5 py-4 text-center font-semibold text-gray-500">
                          {formatMinutes(driver.avgDeliveryMinutes)}
                        </td>
                        <td className="px-5 py-4 w-48">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${successColor(driver.successRate)}`}
                                style={{ width: `${driver.successRate}%` }}
                              />
                            </div>
                            <span className={`text-[11px] font-black w-9 text-right ${successTextColor(driver.successRate)}`}>
                              {driver.successRate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Leyenda colores */}
          <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            <span>Leyenda:</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> ≥ 80% Excelente</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> ≥ 50% Regular</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> &lt; 50% Crítico</span>
          </div>
        </>
      )}
    </div>
  );
};

export default DispatchReportPage;
