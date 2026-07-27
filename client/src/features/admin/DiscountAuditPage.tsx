import React, { useState, useEffect } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import {
  Loader2, Calendar, Search, Tag, TrendingDown,
  ShoppingCart, Users, Building2, BarChart2,
} from 'lucide-react';

interface DiscountOrder {
  id: number;
  createdAt: string;
  vendorId: number | null;
  vendorName: string;
  branchId: number;
  branchName: string;
  subtotal: number;
  discountTotal: number;
  total: number;
}

interface VendorStat {
  vendorId: number;
  vendorName: string;
  orderCount: number;
  totalDiscount: number;
  avgDiscount: number;
}

interface ReportData {
  totalOrders: number;
  totalDiscountAmount: number;
  avgDiscountPerOrder: number;
  orders: DiscountOrder[];
  byVendor: VendorStat[];
}

interface Employee { id: number; name: string; lastName: string; }
interface Branch { id: number; name: string; }

function fmt(n: number) {
  return `S/ ${n.toFixed(2)}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const DiscountAuditPage: React.FC = () => {
  useDocumentTitle("Auditoría de Descuentos — E-Commerce");

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    axiosInstance.get('/v1/employees').then(r => setEmployees(r.data.data?.items ?? r.data.data ?? r.data)).catch(() => {});
    axiosInstance.get('/v1/branches').then(r => setBranches(r.data.data ?? r.data)).catch(() => {});
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!from || !to) { toast.error('Selecciona el rango de fechas'); return; }
    if (new Date(from) > new Date(to)) { toast.error('La fecha inicio no puede ser mayor a la fecha fin'); return; }
    setLoading(true);
    try {
      const params: Record<string, string> = {
        from: new Date(from).toISOString(),
        to: new Date(to).toISOString(),
      };
      if (vendorId) params.vendorId = vendorId;
      if (branchId) params.branchId = branchId;

      const { data } = await axiosInstance.get('/v1/admin/reports/discounts', { params });
      setReport(data.data);
      if (data.data.totalOrders === 0) toast('Sin ventas con descuento en el período seleccionado', { icon: 'ℹ️' });
    } catch {
      toast.error('Error al generar el reporte de auditoría');
    } finally {
      setLoading(false);
    }
  };

  const kpis = report ? [
    {
      label: 'Ventas con Descuento',
      value: report.totalOrders,
      icon: ShoppingCart,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      label: 'Descuento Total Aplicado',
      value: fmt(report.totalDiscountAmount),
      icon: TrendingDown,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      label: 'Promedio por Venta',
      value: fmt(report.avgDiscountPerOrder),
      icon: Tag,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ] : [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="border-b border-gray-100 pb-5">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Finanzas</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Auditoría de Descuentos POS</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ventas con descuento aplicado, impacto total en margen y detalle por vendedor.
        </p>
      </div>

      {/* Filtros */}
      <form onSubmit={handleGenerate} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-1">
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

          <div className="space-y-1">
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

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Vendedor</label>
            <div className="relative">
              <select
                value={vendorId}
                onChange={e => setVendorId(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none appearance-none"
              >
                <option value="">Todos</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} {emp.lastName}</option>
                ))}
              </select>
              <Users className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Sucursal</label>
            <div className="relative">
              <select
                value={branchId}
                onChange={e => setBranchId(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none appearance-none"
              >
                <option value="">Todas</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <Building2 className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            Generar Reporte
          </button>
        </div>
      </form>

      {report && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

          {/* Tabla por vendedor */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-extrabold text-gray-900">Impacto por Vendedor</h2>
              <span className="ml-auto text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {report.byVendor.length} vendedor{report.byVendor.length !== 1 ? 'es' : ''}
              </span>
            </div>
            {report.byVendor.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400 font-semibold">Sin datos.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Vendedor</th>
                      <th className="px-5 py-3 text-center">Nº Ventas</th>
                      <th className="px-5 py-3 text-right">Total Descuento</th>
                      <th className="px-5 py-3 text-right">Promedio/Venta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {report.byVendor.map(v => (
                      <tr key={v.vendorId} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-red-50 border border-red-100 text-red-600 font-black text-xs flex items-center justify-center shrink-0">
                              {v.vendorName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-gray-900">{v.vendorName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center font-bold text-gray-700">{v.orderCount}</td>
                        <td className="px-5 py-4 text-right font-extrabold text-red-600">{fmt(v.totalDiscount)}</td>
                        <td className="px-5 py-4 text-right font-semibold text-gray-500">{fmt(v.avgDiscount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Tabla de ventas */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-extrabold text-gray-900">Detalle de Ventas con Descuento</h2>
              <span className="ml-auto text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {report.orders.length} venta{report.orders.length !== 1 ? 's' : ''}
              </span>
            </div>
            {report.orders.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400 font-semibold">
                Sin ventas con descuento en el período seleccionado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Orden #</th>
                      <th className="px-5 py-3">Fecha</th>
                      <th className="px-5 py-3">Cajero</th>
                      <th className="px-5 py-3">Sucursal</th>
                      <th className="px-5 py-3 text-right">Subtotal</th>
                      <th className="px-5 py-3 text-right">Descuento</th>
                      <th className="px-5 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {report.orders.map(order => (
                      <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <span className="font-black text-gray-900">#{order.id}</span>
                        </td>
                        <td className="px-5 py-4 text-gray-500 font-medium">{fmtDate(order.createdAt)}</td>
                        <td className="px-5 py-4 font-bold text-gray-800">{order.vendorName}</td>
                        <td className="px-5 py-4 text-gray-600">{order.branchName}</td>
                        <td className="px-5 py-4 text-right text-gray-600 font-medium">{fmt(order.subtotal)}</td>
                        <td className="px-5 py-4 text-right font-extrabold text-red-600">-{fmt(order.discountTotal)}</td>
                        <td className="px-5 py-4 text-right font-extrabold text-gray-900">{fmt(order.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                    <tr>
                      <td colSpan={4} className="px-5 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">
                        Totales
                      </td>
                      <td className="px-5 py-3 text-right font-extrabold text-gray-900">
                        {fmt(report.orders.reduce((s, o) => s + o.subtotal, 0))}
                      </td>
                      <td className="px-5 py-3 text-right font-extrabold text-red-600">
                        -{fmt(report.totalDiscountAmount)}
                      </td>
                      <td className="px-5 py-3 text-right font-extrabold text-gray-900">
                        {fmt(report.orders.reduce((s, o) => s + o.total, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DiscountAuditPage;
