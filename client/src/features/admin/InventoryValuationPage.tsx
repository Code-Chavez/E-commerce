import React, { useState, useEffect } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import {
  Loader2, Search, Building2, Boxes,
  Download, FolderTree, Package, BarChart2,
} from 'lucide-react';

interface ValuationItem {
  variantId: number;
  sku: string;
  productName: string;
  categoryName: string;
  branchId: number;
  branchName: string;
  quantity: number;
  unitCost: number;
  salePrice: number;
  valorTotal: number;
}

interface BranchValuation {
  branchId: number;
  branchName: string;
  variantes: number;
  valor: number;
}

interface CategoryValuation {
  categoryName: string;
  variantes: number;
  valor: number;
}

interface ReportData {
  totalValor: number;
  totalVariantes: number;
  byBranch: BranchValuation[];
  byCategory: CategoryValuation[];
  items: ValuationItem[];
}

interface Branch { id: number; name: string; }

function fmt(n: number) {
  return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function exportToCSV(items: ValuationItem[]) {
  const headers = ['SKU', 'Producto', 'Categoría', 'Sucursal', 'Cantidad', 'Costo Unitario', 'Precio Venta', 'Valor Total'];
  const escape = (v: any) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = items.map(i => [
    escape(i.sku),
    escape(i.productName),
    escape(i.categoryName),
    escape(i.branchName),
    escape(i.quantity),
    escape(i.unitCost.toFixed(2)),
    escape((i.salePrice ?? 0).toFixed(2)),
    escape(i.valorTotal.toFixed(2)),
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', `valorizacion_inventario_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const InventoryValuationPage: React.FC = () => {
  useDocumentTitle("Valorización de Inventario — D'Mendoza");

  const [branchId, setBranchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    axiosInstance.get('/v1/branches').then(r => setBranches(r.data.data ?? r.data)).catch(() => {});
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (branchId) params.branchId = branchId;
      const { data } = await axiosInstance.get('/v1/admin/reports/inventory-valuation', { params });
      setReport(data.data);
      if (data.data.totalVariantes === 0) toast('Sin stock valorizable encontrado', { icon: 'ℹ️' });
    } catch {
      toast.error('Error al generar la valorización de inventario');
    } finally {
      setLoading(false);
    }
  };

  const topBranchValor = report?.byBranch[0]?.valor ?? 0;
  const topCategoryValor = report?.byCategory[0]?.valor ?? 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="border-b border-gray-100 pb-5">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Inventario</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Valorización del Inventario</h1>
        <p className="text-sm text-gray-500 mt-1">
          Valor monetario del stock disponible cruzando existencias con el último costo unitario del Kardex.
        </p>
      </div>

      {/* Filtros */}
      <form onSubmit={handleGenerate} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="space-y-1 flex-1 max-w-xs">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Sucursal</label>
            <div className="relative">
              <select
                value={branchId}
                onChange={e => setBranchId(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none appearance-none"
              >
                <option value="">Todas las sucursales</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <Building2 className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2 shrink-0"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            Calcular Valorización
          </button>
          {report && report.items.length > 0 && (
            <button
              type="button"
              onClick={() => exportToCSV(report.items)}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar Excel
            </button>
          )}
        </div>
      </form>

      {report && (
        <>
          {/* KPI principal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-900 rounded-2xl p-6 flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Boxes className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Valor Total del Inventario</p>
                <p className="text-3xl font-extrabold text-white mt-1">{fmt(report.totalValor)}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                <Package className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Variantes Valorizadas</p>
                <p className="text-3xl font-extrabold text-gray-900 mt-1">{report.totalVariantes}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Por sucursal */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-extrabold text-gray-900">Por Sucursal</h2>
              </div>
              {report.byBranch.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400">Sin datos.</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {report.byBranch.map(b => {
                    const pct = topBranchValor > 0 ? (b.valor / topBranchValor) * 100 : 0;
                    return (
                      <div key={b.branchId} className="px-5 py-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-gray-900">{b.branchName}</span>
                          <span className="text-xs font-extrabold text-gray-900">{fmt(b.valor)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-gray-400 w-16 text-right">
                            {b.variantes} var.
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Por categoría */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-extrabold text-gray-900">Por Categoría</h2>
              </div>
              {report.byCategory.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400">Sin datos.</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {report.byCategory.map(c => {
                    const pct = topCategoryValor > 0 ? (c.valor / topCategoryValor) * 100 : 0;
                    return (
                      <div key={c.categoryName} className="px-5 py-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-gray-900">{c.categoryName}</span>
                          <span className="text-xs font-extrabold text-gray-900">{fmt(c.valor)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-gray-400 w-16 text-right">
                            {c.variantes} var.
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Tabla detalle */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-extrabold text-gray-900">Detalle por Variante</h2>
              <span className="ml-auto text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {report.items.length} registros
              </span>
            </div>
            {report.items.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-400 font-semibold">
                Sin stock con costo registrado en el Kardex.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3">SKU</th>
                      <th className="px-5 py-3">Producto</th>
                      <th className="px-5 py-3">Categoría</th>
                      <th className="px-5 py-3">Sucursal</th>
                      <th className="px-5 py-3 text-right">Cantidad</th>
                      <th className="px-5 py-3 text-right">Costo Unit.</th>
                      <th className="px-5 py-3 text-right">P. Venta</th>
                      <th className="px-5 py-3 text-right">Valor Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {report.items.map((item, idx) => (
                      <tr key={`${item.variantId}-${item.branchId}-${idx}`} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3 font-mono text-[11px] text-gray-500">{item.sku}</td>
                        <td className="px-5 py-3 font-bold text-gray-900 max-w-[180px] truncate">{item.productName}</td>
                        <td className="px-5 py-3 text-gray-500">{item.categoryName}</td>
                        <td className="px-5 py-3 text-gray-600">{item.branchName}</td>
                        <td className="px-5 py-3 text-right font-bold text-gray-700">{item.quantity}</td>
                        <td className="px-5 py-3 text-right text-gray-500 font-medium">{fmt(item.unitCost)}</td>
                        <td className="px-5 py-3 text-right text-gray-500">{fmt(item.salePrice ?? 0)}</td>
                        <td className="px-5 py-3 text-right font-extrabold text-gray-900">{fmt(item.valorTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                    <tr>
                      <td colSpan={6} className="px-5 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">
                        Total
                      </td>
                      <td className="px-5 py-3 text-right font-extrabold text-gray-900">
                        {fmt(report.totalValor)}
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

export default InventoryValuationPage;
