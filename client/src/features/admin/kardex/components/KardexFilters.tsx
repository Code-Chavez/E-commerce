import React, { useState, useEffect } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import { VariantAutocomplete } from '../../entries/components/VariantAutocomplete';
import type { VariantSearchResult } from '../../entries/hooks/useStockEntries';
import type { KardexFilters as IKardexFilters, KardexType } from '../types/kardex.types';
import { Filter, Calendar, Building, Shirt, RefreshCw, X } from 'lucide-react';

interface BranchOption {
  id: number;
  name: string;
}

interface KardexFiltersProps {
  onFilter: (filters: IKardexFilters) => void;
}

export const KardexFilters: React.FC<KardexFiltersProps> = ({ onFilter }) => {
  const [selectedVariant, setSelectedVariant] = useState<VariantSearchResult | null>(null);
  const [branchId, setBranchId] = useState<string>('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [type, setType] = useState<KardexType | ''>('');

  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [loadingBranches, setLoadingBranches] = useState<boolean>(false);

  useEffect(() => {
    const fetchBranches = async () => {
      setLoadingBranches(true);
      try {
        const { data } = await axiosInstance.get('/v1/branches');
        if (data.success) {
          setBranches((data.data || []).filter((b: any) => b.isActive));
        }
      } catch (err) {
        console.error('Error cargando sucursales:', err);
      } finally {
        setLoadingBranches(false);
      }
    };
    fetchBranches();
  }, []);

  // Emitimos los filtros actualizados
  useEffect(() => {
    onFilter({
      variantId: selectedVariant ? selectedVariant.id : null,
      branchId: branchId ? Number(branchId) : null,
      from: from || undefined,
      to: to || undefined,
      type: type || undefined,
    });
  }, [selectedVariant, branchId, from, to, type, onFilter]);

  const handleSelectVariant = (variant: VariantSearchResult) => {
    setSelectedVariant(variant);
  };

  const handleClearVariant = () => {
    setSelectedVariant(null);
  };

  const handleClearAll = () => {
    setSelectedVariant(null);
    setBranchId('');
    setFrom('');
    setTo('');
    setType('');
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-[#D9D9D2]/50 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-[#3F3F3F] uppercase tracking-wider">
          <Filter className="w-4 h-4 text-[#6B6B6B]" />
          <span>Filtros de Búsqueda</span>
        </div>
        <button
          onClick={handleClearAll}
          className="text-xs font-bold text-[#6B6B6B] hover:text-[#3F3F3F] transition-colors flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Limpiar Filtros</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        {/* Producto Autocomplete */}
        <div className="col-span-1 md:col-span-4 space-y-1">
          <label className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider block flex items-center gap-1">
            <Shirt className="w-3 h-3" />
            <span>Variante (Producto / SKU)</span>
          </label>
          
          {selectedVariant ? (
            <div className="flex items-center justify-between p-2 border-2 border-[#3F3F3F] bg-[#FAFAFA] rounded-xl">
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold text-[#3F3F3F] truncate">
                  {selectedVariant.productName}
                </span>
                <span className="text-[10px] text-[#6B6B6B] font-mono">
                  SKU: {selectedVariant.sku}
                </span>
              </div>
              <button
                onClick={handleClearVariant}
                className="p-1 hover:bg-gray-200 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
                title="Quitar variante"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <VariantAutocomplete onSelect={handleSelectVariant} />
          )}
        </div>

        {/* Sucursal select */}
        <div className="col-span-1 md:col-span-3 space-y-1">
          <label htmlFor="branch-select" className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider block flex items-center gap-1">
            <Building className="w-3 h-3" />
            <span>Sucursal</span>
          </label>
          <select
            id="branch-select"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            disabled={loadingBranches}
            className="w-full p-2.5 border-2 border-[#EBEBE8] rounded-xl focus:outline-none focus:border-[#3F3F3F] font-semibold text-xs text-[#3F3F3F] disabled:opacity-50"
          >
            <option value="">Selecciona Sucursal...</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Rango de fechas */}
        <div className="col-span-1 md:col-span-3 space-y-1">
          <label className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider block flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Rango de Fechas (Desde - Hasta)</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full p-2 border-2 border-[#EBEBE8] rounded-xl focus:outline-none focus:border-[#3F3F3F] font-semibold text-xs text-[#3F3F3F]"
            />
            <span className="text-gray-400 text-xs font-bold">a</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full p-2 border-2 border-[#EBEBE8] rounded-xl focus:outline-none focus:border-[#3F3F3F] font-semibold text-xs text-[#3F3F3F]"
            />
          </div>
        </div>

        {/* Tipo de movimiento */}
        <div className="col-span-1 md:col-span-2 space-y-1">
          <label htmlFor="type-select" className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
            Tipo
          </label>
          <select
            id="type-select"
            value={type}
            onChange={(e) => setType(e.target.value as KardexType | '')}
            className="w-full p-2.5 border-2 border-[#EBEBE8] rounded-xl focus:outline-none focus:border-[#3F3F3F] font-semibold text-xs text-[#3F3F3F]"
          >
            <option value="">Todos</option>
            <option value="COMPRA">Compra</option>
            <option value="VENTA">Venta</option>
            <option value="TRANSFERENCIA">Transferencia</option>
            <option value="DEVOLUCION">Devolución</option>
            <option value="AJUSTE">Ajuste</option>
          </select>
        </div>
      </div>
    </div>
  );
};
