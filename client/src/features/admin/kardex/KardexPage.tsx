import React, { useState, useEffect } from 'react';
import { useAuth } from '@/shared/context/AuthContext';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { useKardex } from './hooks/useKardex';
import { useInventorySettings } from './hooks/useInventorySettings';
import { KardexFilters } from './components/KardexFilters';
import { KardexTable } from './components/KardexTable';
import { InventorySettingsModal } from './components/InventorySettingsModal';
import type { KardexFilters as IKardexFilters } from './types/kardex.types';
import { Sparkles, Settings2 } from 'lucide-react';

export const KardexPage: React.FC = () => {
  useDocumentTitle("Kardex — Historial de Valorización - D'Mendoza");
  const { user } = useAuth();
  
  const { entries, loading, fetchKardex } = useKardex();
  const { 
    settings, 
    loading: loadingSettings, 
    updating: updatingSettings, 
    updateMethod 
  } = useInventorySettings();

  const [activeFilters, setActiveFilters] = useState<IKardexFilters>({
    variantId: null,
    branchId: null,
  });

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // Ejecutar búsqueda cuando cambien variante o sucursal, o filtros adicionales
  useEffect(() => {
    if (activeFilters.variantId && activeFilters.branchId) {
      fetchKardex(activeFilters);
    }
  }, [activeFilters, fetchKardex]);

  const handleFilterChange = React.useCallback((filters: IKardexFilters) => {
    setActiveFilters(filters);
  }, []);

  const isValuableSearch = activeFilters.variantId !== null && activeFilters.branchId !== null;
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#D9D9D2]/40 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#3F3F3F]/80 uppercase tracking-widest mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#3F3F3F]" />
            <span>Módulo de Inventario</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#3F3F3F] tracking-tight">
            Kardex — Historial de Valorización
          </h1>
          <p className="text-sm text-[#6B6B6B] mt-1">
            Consulta el historial de movimientos y costos unitarios por variante y sucursal.
          </p>
        </div>

        {/* Botón de configuración - Solo ADMIN */}
        {isAdmin && (
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#D9D9D2] hover:bg-[#FAFAFA] text-[#3F3F3F] text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm hover:shadow"
          >
            <Settings2 className="w-4 h-4 text-[#3F3F3F]" />
            <span>Método de Valorización</span>
          </button>
        )}
      </div>

      {/* Filtros */}
      <KardexFilters onFilter={handleFilterChange} />

      {/* Tabla de movimientos */}
      <KardexTable 
        entries={entries} 
        loading={loading} 
        hasSelectedFilters={isValuableSearch} 
      />

      {/* Modal de Configuración */}
      {isAdmin && (
        <InventorySettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          settings={settings}
          loading={loadingSettings}
          updating={updatingSettings}
          onSave={updateMethod}
        />
      )}
    </div>
  );
};
