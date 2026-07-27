import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { PickingTable } from './components/picking/PickingTable';
import { usePicking } from './hooks/usePicking';
import { PackageSearch, Loader2 } from 'lucide-react';

const PickingPage: React.FC = () => {
  const { 
    deliveries, 
    isLoading, 
    error, 
    fetchPendingPickings 
  } = usePicking();

  // Load pending pickings (Deliveries) on mount
  useEffect(() => {
    fetchPendingPickings();
  }, [fetchPendingPickings]);

  return (
    <>
      <Helmet>
        <title>Generación de Picking | Admin E-Commerce</title>
      </Helmet>
      
      <div className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm font-semibold shadow-sm">
            {error}
          </div>
        )}

        {/* Header Info */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-accent/10 text-brand-accent flex items-center justify-center shrink-0">
              <PackageSearch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-brand-accent tracking-tight">Listas de Picking (Despachos)</h2>
              <p className="text-xs text-brand-text mt-0.5">Visualiza las listas de picking generadas automáticamente para los pedidos pagados.</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
            <Loader2 className="w-10 h-10 animate-spin text-brand-accent" />
          </div>
        ) : (
          <PickingTable
            deliveries={deliveries}
          />
        )}
      </div>
    </>
  );
};

export default PickingPage;

