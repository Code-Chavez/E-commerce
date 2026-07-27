import React, { useState, useEffect } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import {
  Loader2, Calendar, Search, Trophy, TrendingUp,
  ShoppingCart, Users, Building2, BarChart2,
} from 'lucide-react';

interface SellerStat {
  rank: number;
  vendorId: number;
  vendorName: string;
  transactions: number;
  totalVendido: number;
  ticketPromedio: number;
}

interface ReportData {
  totalSellers: number;
  globalAvgTicket: number;
  topTotalVendido: number;
  sellers: SellerStat[];
}

interface Branch { id: number; name: string; }

function fmt(n: number) {
  return `S/ ${n.toFixed(2)}`;
}

function getMedalColor(rank: number) {
  if (rank === 1) return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', medal: '🥇' };
  if (rank === 2) return { bg: 'bg-gray-100', border: 'border-gray-200', text: 'text-gray-500', medal: '🥈' };
  if (rank === 3) return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-500', medal: '🥉' };
  return { bg: 'bg-white', border: 'border-gray-100', text: 'text-gray-400', medal: String(rank) };
}

const SellerRankingPage: React.FC = () => {
  useDocumentTitle("Ranking de Vendedores — D'Mendoza");

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [branchId, setBranchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
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
      if (branchId) params.branchId = branchId;

      const { data } = await axiosInstance.get('/v1/admin/reports/seller-ranking', { params });
      setReport(data.data);
      if (data.data.totalSellers === 0) toast('Sin ventas completadas en el período seleccionado', { icon: 'ℹ️' });
    } catch {
      toast.error('Error al generar el ranking de vendedores');
    } finally {
      setLoading(false);
    }
  };

  const kpis = report ? [
    {
      label: 'Vendedores',
      value: report.totalSellers,
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      label: 'Venta Más Alta',
      value: fmt(report.topTotalVendido),
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Ticket Promedio Global',
      value: fmt(report.globalAvgTicket),
      icon: ShoppingCart,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ] : [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="border-b border-gray-100 pb-5">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Finanzas</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Ranking de Vendedores</h1>
        <p className="text-sm text-gray-500 mt-1">
          Clasificación por total vendido, ticket promedio y número de transacciones completadas.
        </p>
      </div>

      {/* Filtros */}
      <form onSubmit={handleGenerate} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
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
            Generar Ranking
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

          {/* Ranking */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-extrabold text-gray-900">Ranking de Desempeño</h2>
              <span className="ml-auto text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {report.sellers.length} vendedor{report.sellers.length !== 1 ? 'es' : ''}
              </span>
            </div>

            {report.sellers.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-400 font-semibold">
                Sin ventas completadas en el período seleccionado.
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {report.sellers.map(seller => {
                  const medal = getMedalColor(seller.rank);
                  const barWidth = report.topTotalVendido > 0
                    ? (seller.totalVendido / report.topTotalVendido) * 100
                    : 0;

                  return (
                    <div
                      key={seller.vendorId}
                      className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors ${seller.rank <= 3 ? medal.bg : ''}`}
                    >
                      {/* Posición */}
                      <div className={`w-9 h-9 rounded-xl border ${medal.border} flex items-center justify-center shrink-0`}>
                        {seller.rank <= 3 ? (
                          <span className="text-lg leading-none">{medal.medal}</span>
                        ) : (
                          <span className={`text-xs font-black ${medal.text}`}>{seller.rank}</span>
                        )}
                      </div>

                      {/* Avatar + nombre */}
                      <div className="flex items-center gap-3 w-48 shrink-0">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 font-black text-xs flex items-center justify-center shrink-0">
                          {seller.vendorName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-gray-900 text-sm truncate">{seller.vendorName}</span>
                      </div>

                      {/* Barra de progreso + total vendido */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-indigo-500 transition-all"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                          <span className="text-sm font-extrabold text-gray-900 w-24 text-right shrink-0">
                            {fmt(seller.totalVendido)}
                          </span>
                        </div>
                      </div>

                      {/* Ticket promedio */}
                      <div className="text-right shrink-0 w-28">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ticket prom.</p>
                        <p className="text-xs font-extrabold text-gray-700">{fmt(seller.ticketPromedio)}</p>
                      </div>

                      {/* Transacciones */}
                      <div className="text-right shrink-0 w-20">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ventas</p>
                        <p className="text-xs font-extrabold text-gray-700">{seller.transactions}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SellerRankingPage;
