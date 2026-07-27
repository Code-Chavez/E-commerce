import React, { useState } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';
import { Search, Download, Loader2, ArrowUp, ArrowDown, Sparkles, TrendingUp, AlertTriangle, Calendar, Layers, ShieldAlert, BarChart3 } from 'lucide-react';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';

interface RotationRow {
  variantId: number;
  sku: string;
  productName: string;
  branchName: string;
  unitsSold: number;
  avgStock: number;
  rotationRatio: number;
  stockDays: number | null;
  periodDays: number;
}

type SortKey = keyof RotationRow;

const RotationReportPage: React.FC = () => {
  useDocumentTitle('Rotación de Inventario - D\'Mendoza');

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [branchId, setBranchId] = useState('');
  const [data, setData] = useState<RotationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('rotationRatio');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!from || !to) { toast.error('Selecciona el rango de fechas'); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: new Date(from).toISOString(),
        to: new Date(to).toISOString(),
        ...(branchId ? { branchId } : {}),
      });
      const { data: res } = await axiosInstance.get(`/v1/reports/inventory-rotation?${params}`);
      setData(res.data);
      if (res.data.length === 0) {
        toast('Sin movimientos en el período seleccionado', { icon: 'ℹ️' });
      }
    } catch { 
      toast.error('Error al cargar el reporte de rotación'); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(false); }
  };

  const sorted = [...data].sort((a, b) => {
    const va = a[sortKey] ?? 0;
    const vb = b[sortKey] ?? 0;
    return sortAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
  });

  const exportCSV = () => {
    if (sorted.length === 0) return;
    const header = ['SKU', 'Producto', 'Sucursal', 'Vendidas', 'Stock Prom.', 'Ratio Rotación', 'Días de Stock'];
    const rows = sorted.map(r => [r.sku, r.productName, r.branchName, r.unitsSold, r.avgStock.toFixed(2), r.rotationRatio.toFixed(2), r.stockDays ?? 'N/A']);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rotacion-inventario-${from}-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return null;
    return sortAsc ? <ArrowUp size={12} className="text-[#3F3F3F]" /> : <ArrowDown size={12} className="text-[#3F3F3F]" />;
  };

  const Th = ({ label, k, center = false }: { label: string; k: SortKey; center?: boolean }) => (
    <th 
      className={`px-5 py-4 text-xs font-bold text-[#3F3F3F]/80 uppercase tracking-wider cursor-pointer hover:bg-[#D9D9D2]/20 select-none transition-colors ${center ? 'text-center' : 'text-left'}`} 
      onClick={() => handleSort(k)}
    >
      <span className={`flex items-center gap-1.5 ${center ? 'justify-center' : ''}`}>
        {label}
        <SortIcon k={k} />
      </span>
    </th>
  );

  // Compute stats metrics
  const totalSold = data.reduce((acc, curr) => acc + curr.unitsSold, 0);
  const avgRotation = data.length > 0 ? data.reduce((acc, curr) => acc + curr.rotationRatio, 0) / data.length : 0;
  const criticalItems = data.filter(item => item.rotationRatio < 1).length;
  
  const validDays = data.filter(item => item.stockDays !== null);
  const avgStockDays = validDays.length > 0 ? validDays.reduce((acc, curr) => acc + (curr.stockDays ?? 0), 0) / validDays.length : 0;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#D9D9D2]/40 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#3F3F3F]/80 uppercase tracking-widest mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Métricas e Inteligencia Comercial</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#3F3F3F] tracking-tight">
            Rotación de Inventario
          </h1>
          <p className="text-sm text-[#6B6B6B] mt-1 max-w-xl">
            Monitorea el ciclo de vida de tus productos, el ritmo de salida y los días estimados de cobertura física por variante.
          </p>
        </div>
      </div>

      {/* Date Filters & Actions Panel */}
      <div className="bg-white rounded-2xl border border-[#D9D9D2]/30 p-5 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold text-[#3F3F3F] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#6B6B6B]" />
              <span>Fecha Desde</span>
            </label>
            <input 
              type="date" 
              value={from} 
              onChange={e => setFrom(e.target.value)} 
              required
              className="w-full px-4 py-2.5 rounded-xl border border-[#D9D9D2]/70 bg-[#FAFAFA] text-sm text-[#3F3F3F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]/20 focus:border-[#3F3F3F] transition-all font-medium" 
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold text-[#3F3F3F] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#6B6B6B]" />
              <span>Fecha Hasta</span>
            </label>
            <input 
              type="date" 
              value={to} 
              onChange={e => setTo(e.target.value)} 
              required
              className="w-full px-4 py-2.5 rounded-xl border border-[#D9D9D2]/70 bg-[#FAFAFA] text-sm text-[#3F3F3F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]/20 focus:border-[#3F3F3F] transition-all font-medium" 
            />
          </div>

          <div className="w-36">
            <label className="block text-[10px] font-bold text-[#3F3F3F] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#6B6B6B]" />
              <span>Sucursal (Opc.)</span>
            </label>
            <input 
              type="number" 
              placeholder="ID sede" 
              value={branchId} 
              onChange={e => setBranchId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#D9D9D2]/70 bg-[#FAFAFA] text-sm text-[#3F3F3F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]/20 focus:border-[#3F3F3F] transition-all" 
            />
          </div>

          <div className="flex gap-2.5 w-full sm:w-auto">
            <button 
              type="submit" 
              disabled={loading}
              className="flex-grow sm:flex-none flex items-center justify-center gap-2 bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 text-white px-6 py-3 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              <span>Consultar</span>
            </button>

            {data.length > 0 && (
              <button 
                type="button" 
                onClick={exportCSV}
                className="flex-grow sm:flex-none flex items-center justify-center gap-2 border border-[#D9D9D2] hover:bg-[#FAFAFA] text-[#3F3F3F] px-5 py-3 rounded-xl text-xs font-bold transition-all"
              >
                <Download size={14} /> 
                <span>Exportar CSV</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Dynamic KPI summary dashboard */}
      {data.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          <div className="bg-white border border-[#D9D9D2]/30 rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-[#6B6B6B]">
              <span className="text-[10px] font-bold uppercase tracking-wider">Unidades Vendidas</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-[#3F3F3F]">{totalSold}</span>
              <span className="text-xs text-[#6B6B6B]">uds.</span>
            </div>
            <p className="text-[10px] text-[#6B6B6B]/80">Desplazamiento neto de mercancía</p>
          </div>

          <div className="bg-white border border-[#D9D9D2]/30 rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-[#6B6B6B]">
              <span className="text-[10px] font-bold uppercase tracking-wider">Ratio de Rotación</span>
              <BarChart3 className="w-4 h-4 text-[#3F3F3F]" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-[#3F3F3F]">{avgRotation.toFixed(2)}</span>
              <span className="text-xs text-[#6B6B6B]">x / mes</span>
            </div>
            <p className="text-[10px] text-[#6B6B6B]/80">Promedio de recambio de inventario</p>
          </div>

          <div className="bg-white border border-[#D9D9D2]/30 rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-[#6B6B6B]">
              <span className="text-[10px] font-bold uppercase tracking-wider">Días de Stock</span>
              <Calendar className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-[#3F3F3F]">{avgStockDays > 0 ? Math.round(avgStockDays) : '—'}</span>
              <span className="text-xs text-[#6B6B6B]">días</span>
            </div>
            <p className="text-[10px] text-[#6B6B6B]/80">Cobertura promedio estimada</p>
          </div>

          <div className={`border rounded-2xl p-5 shadow-sm space-y-2 transition-colors ${
            criticalItems > 0 ? 'bg-amber-50/50 border-amber-200' : 'bg-white border-[#D9D9D2]/30'
          }`}>
            <div className="flex items-center justify-between text-[#6B6B6B]">
              <span className="text-[10px] font-bold uppercase tracking-wider">Alertas de Rotación</span>
              <ShieldAlert className={`w-4 h-4 ${criticalItems > 0 ? 'text-amber-600' : 'text-[#6B6B6B]'}`} />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-extrabold ${criticalItems > 0 ? 'text-amber-800' : 'text-[#3F3F3F]'}`}>
                {criticalItems}
              </span>
              <span className="text-xs text-[#6B6B6B]">variantes</span>
            </div>
            <p className="text-[10px] text-[#6B6B6B]/80">Productos con ratio menor a 1.00</p>
          </div>

        </div>
      )}

      {/* Main inventory table list */}
      {data.length > 0 ? (
        <div className="bg-white border border-[#D9D9D2]/30 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-[#D9D9D2]/40">
                  <Th label="SKU" k="sku" />
                  <Th label="Producto" k="productName" />
                  <Th label="Sucursal" k="branchName" />
                  <Th label="Vendidas" k="unitsSold" center />
                  <Th label="Stock Prom." k="avgStock" center />
                  <Th label="Ratio Rotación" k="rotationRatio" center />
                  <Th label="Días de Stock" k="stockDays" center />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9D9D2]/30">
                {sorted.map((row, i) => {
                  const isLowRotation = row.rotationRatio < 1;
                  return (
                    <tr 
                      key={i} 
                      className={`hover:bg-[#FAFAFA]/70 transition-all ${
                        isLowRotation ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="px-5 py-4 font-mono text-xs text-[#3F3F3F]/80 font-bold">
                        {row.sku}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-[#3F3F3F]">
                          {row.productName}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs font-semibold text-[#6B6B6B]">
                        {row.branchName}
                      </td>
                      <td className="px-5 py-4 text-center font-bold text-[#3F3F3F]">
                        {row.unitsSold}
                      </td>
                      <td className="px-5 py-4 text-center font-medium text-[#6B6B6B]/80">
                        {row.avgStock.toFixed(2)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="inline-flex justify-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold flex items-center gap-1 ${
                            isLowRotation 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isLowRotation && <AlertTriangle className="w-3 h-3" />}
                            <span>{row.rotationRatio.toFixed(2)}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`font-semibold text-xs ${row.stockDays !== null ? 'text-[#3F3F3F]' : 'text-gray-400'}`}>
                          {row.stockDays !== null ? `${row.stockDays}d` : '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        !loading && (
          <div className="bg-[#F7F7F5]/50 border border-[#D9D9D2]/30 rounded-2xl p-12 text-center space-y-3">
            <BarChart3 className="w-10 h-10 text-[#6B6B6B]/40 mx-auto" />
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-sm font-bold text-[#3F3F3F]">Sin Datos Consultados</h3>
              <p className="text-xs text-[#6B6B6B]">
                Selecciona un rango de fechas en el panel superior y presiona el botón "Consultar" para analizar la rotación.
              </p>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default RotationReportPage;

