import React, { useEffect, useState, useMemo } from 'react';
import { Sparkles, Search, Layers, ShieldAlert, ArrowDownToLine, Loader2, Building2, Sliders } from 'lucide-react';
import { useStock } from './hooks/useStock';
import axiosInstance from '@/shared/api/axiosInstance';
import { useBranches } from '../branches/hooks/useBranches';
import { StockTable } from './components/StockTable';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { ExportButton } from '@/shared/components/ExportButton';

export const StockPage: React.FC = () => {
  useDocumentTitle('Control de Stock y Existencias');

  const { stock, loading, fetchStock } = useStock();
  const { branches, fetchBranches, loading: loadingBranches } = useBranches();

  const [skuFilter, setSkuFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState<string>('');
  const [minStockThreshold, setMinStockThreshold] = useState<number>(10);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  useEffect(() => {
    fetchStock({
      sku: skuFilter || undefined,
      branchId: branchFilter ? Number(branchFilter) : undefined,
    });
  }, [fetchStock, skuFilter, branchFilter]);

  useEffect(() => {
    axiosInstance.get('/v1/admin/settings').then(res => {
      const minStockSetting = res.data.find((s: any) => s.key === 'MIN_STOCK_ALERT');
      if (minStockSetting && minStockSetting.value) {
        setMinStockThreshold(parseInt(minStockSetting.value, 10));
      }
    }).catch(() => {});
  }, []);

  const activeBranches = useMemo(() => {
    return branches.filter((b) => b.isActive);
  }, [branches]);

  // Compute stock health KPI metrics
  const stats = useMemo(() => {
    const totalVarieties = stock.length;
    const lowStockCount = stock.filter((item) => item.globalStock > 0 && item.globalStock <= minStockThreshold).length;
    const outOfStockCount = stock.filter((item) => item.globalStock === 0).length;
    
    return { totalVarieties, lowStockCount, outOfStockCount };
  }, [stock, minStockThreshold]);

  const isLoading = loading || loadingBranches;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#D9D9D2]/40 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#3F3F3F]/80 uppercase tracking-widest mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Módulo de Inventario</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#3F3F3F] tracking-tight">
            Control de Stock
          </h1>
          <p className="text-sm text-[#6B6B6B] mt-1 max-w-2xl">
            Monitorea el inventario consolidado global y desglosado por cada sede en tiempo real. Configura alertas personalizadas para reabastecimiento rápido.
          </p>
        </div>
        <div>
          <ExportButton type="inventory" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* KPI 1 - Total Products */}
        <div className="bg-white rounded-2xl border border-[#D9D9D2]/30 p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#3F3F3F]/5 text-[#3F3F3F]">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">Variantes Activas</span>
            <span className="text-2xl font-extrabold text-[#3F3F3F] mt-0.5 block">{stats.totalVarieties}</span>
          </div>
        </div>

        {/* KPI 2 - Reorder Level */}
        <div className="bg-white rounded-2xl border border-[#D9D9D2]/30 p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <ArrowDownToLine className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">Por Reabastecer</span>
            <span className="text-2xl font-extrabold text-[#3F3F3F] mt-0.5 block">{stats.lowStockCount}</span>
          </div>
        </div>

        {/* KPI 3 - Out of Stock */}
        <div className="bg-white rounded-2xl border border-[#D9D9D2]/30 p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">Agotados</span>
            <span className="text-2xl font-extrabold text-[#3F3F3F] mt-0.5 block">{stats.outOfStockCount}</span>
          </div>
        </div>

      </div>

      {/* Filters & Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-end bg-[#FAFAFA]/70 border border-[#D9D9D2]/40 p-5 rounded-2xl">
        
        {/* Filter 1 - Search SKU/Text */}
        <div className="lg:col-span-2">
          <label className="block text-xs font-bold text-[#3F3F3F] uppercase tracking-wider mb-2">
            Buscar variantes
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B6B6B]/80">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Buscar por SKU o nombre de producto..."
              value={skuFilter}
              onChange={(e) => setSkuFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D9D9D2]/70 bg-white text-sm text-[#3F3F3F] placeholder-[#6B6B6B]/50 focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]/20 focus:border-[#3F3F3F] transition-all"
            />
          </div>
        </div>

        {/* Filter 2 - Sede Select */}
        <div>
          <label className="block text-xs font-bold text-[#3F3F3F] uppercase tracking-wider mb-2">
            Sucursal
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B6B6B]">
              <Building2 className="w-4 h-4" />
            </div>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D9D9D2]/70 bg-white text-sm text-[#3F3F3F] focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]/20 focus:border-[#3F3F3F] transition-all appearance-none"
            >
              <option value="">Todas las sucursales</option>
              {activeBranches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Control 3 - Dynamic Stock Limit */}
        <div>
          <label className="block text-xs font-bold text-[#3F3F3F] uppercase tracking-wider mb-2">
            Alerta Stock Mínimo
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B6B6B]">
              <Sliders className="w-4 h-4" />
            </div>
            <input
              type="number"
              min="0"
              value={minStockThreshold}
              onChange={(e) => setMinStockThreshold(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D9D9D2]/70 bg-white text-sm text-[#3F3F3F] focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]/20 focus:border-[#3F3F3F] transition-all"
            />
          </div>
        </div>

      </div>

      {/* Main Table view */}
      <div>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#3F3F3F] animate-spin" />
            <p className="text-sm text-[#6B6B6B] mt-2">Cargando control de existencias...</p>
          </div>
        ) : (
          <StockTable
            stock={stock}
            activeBranches={activeBranches}
            minStockThreshold={minStockThreshold}
          />
        )}
      </div>

    </div>
  );
};

export default StockPage;
