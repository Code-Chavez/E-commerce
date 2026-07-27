import React, { useEffect, useState, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { 
  Sparkles, 
  Building2, 
  ClipboardList, 
  FileCheck, 
  Loader2, 
  Save, 
  AlertTriangle, 
  CheckCircle2 
} from 'lucide-react';
import { useBranches } from '../branches/hooks/useBranches';
import { useStock } from '../stock/hooks/useStock';
import { useInventoryAudits } from './hooks/useInventoryAudits';
import { auditSchema } from './schemas/audit.schema';
import type { AuditFormData } from './schemas/audit.schema';
import { AuditTable } from './components/AuditTable';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';

export const InventoryAuditPage: React.FC = () => {
  useDocumentTitle('Auditoría de Inventario Físico');

  const { branches, fetchBranches, loading: loadingBranches } = useBranches();
  const { stock, fetchStock, loading: loadingStock } = useStock();
  const { createInventoryAudit, submitting } = useInventoryAudits();

  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<AuditFormData | null>(null);

  const methods = useForm<AuditFormData>({
    resolver: yupResolver(auditSchema) as any,
    defaultValues: {
      branchId: undefined,
      status: 'PENDING',
      items: [],
    },
  });

  const { reset, setValue, handleSubmit, watch } = methods;

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  // Load stock when branch is selected
  useEffect(() => {
    if (selectedBranchId) {
      setValue('branchId', Number(selectedBranchId), { shouldValidate: true });
      fetchStock({ branchId: Number(selectedBranchId) });
    } else {
      setValue('branchId', undefined as any);
      reset({ branchId: undefined, status: 'PENDING', items: [] });
    }
  }, [selectedBranchId, fetchStock, setValue, reset]);

  // Map backend stock items to form default values
  useEffect(() => {
    if (stock.length > 0 && selectedBranchId) {
      const itemsPayload = stock.map((item) => {
        const qty = item.byBranch.find(b => b.branchId === Number(selectedBranchId))?.quantity ?? 0;
        return {
          variantId: item.variantId,
          sku: item.sku,
          productName: item.productName,
          systemQty: qty,
          physicalQty: qty, // Default to matching systemQty for easy auditing
        };
      });
      setValue('items', itemsPayload, { shouldValidate: true });
    }
  }, [stock, selectedBranchId, setValue]);

  const activeBranches = useMemo(() => branches.filter((b) => b.isActive), [branches]);
  const watchedItems = watch('items') || [];

  // Recalculate global audit summary
  const summary = useMemo(() => {
    let totalSystem = 0;
    let totalPhysical = 0;
    let totalFaltantes = 0;
    let totalSobrantes = 0;

    watchedItems.forEach((item) => {
      const sys = Number(item.systemQty) || 0;
      const phy = Number(item.physicalQty) || 0;
      totalSystem += sys;
      totalPhysical += phy;
      
      const diff = phy - sys;
      if (diff < 0) totalFaltantes += Math.abs(diff);
      if (diff > 0) totalSobrantes += diff;
    });

    return { totalSystem, totalPhysical, totalFaltantes, totalSobrantes };
  }, [watchedItems]);

  const handleAuditSubmit = async (data: AuditFormData, status: 'PENDING' | 'CONFIRMED') => {
    const payload = {
      branchId: Number(data.branchId),
      status,
      items: (data.items || []).map((item) => ({
        variantId: Number(item.variantId),
        physicalQty: Number(item.physicalQty),
      })),
    };

    const success = await createInventoryAudit(payload);
    if (success) {
      setSelectedBranchId('');
      reset({ branchId: undefined, status: 'PENDING', items: [] });
    }
  };

  const onPreSubmit = (data: AuditFormData, status: 'PENDING' | 'CONFIRMED') => {
    if (status === 'CONFIRMED') {
      // Open safety dialog modal for confirmed adjustments
      setPendingSubmitData({ ...data, status });
      setIsConfirmModalOpen(true);
    } else {
      handleAuditSubmit(data, 'PENDING');
    }
  };

  const handleConfirmModalAction = () => {
    if (pendingSubmitData) {
      handleAuditSubmit(pendingSubmitData, 'CONFIRMED');
      setIsConfirmModalOpen(false);
      setPendingSubmitData(null);
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
        
        {/* Visual Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#D9D9D2]/40 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#3F3F3F]/80 uppercase tracking-widest mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Módulo de Inventario</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#3F3F3F] tracking-tight">
              Toma de Inventario Físico
            </h1>
            <p className="text-sm text-[#6B6B6B] mt-1 max-w-2xl">
              Registra y concilia las existencias físicas de las sucursales. La confirmación sincronizará automáticamente el stock actual y registrará asientos contables de ajuste.
            </p>
          </div>
        </div>

        {/* Branch Selector Card */}
        <div className="bg-white rounded-2xl border border-[#D9D9D2]/30 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-[#3F3F3F] uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#6B6B6B]" />
              <span>Selección de Sucursal a Auditar</span>
            </h3>
            <p className="text-xs text-[#6B6B6B]">
              Escoge una sucursal para cargar sus existencias del sistema e iniciar el conteo físico.
            </p>
          </div>

          <div className="w-full md:w-80 shrink-0">
            {loadingBranches ? (
              <div className="flex items-center justify-center py-2 text-xs text-[#6B6B6B]">
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                Cargando sucursales...
              </div>
            ) : (
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#D9D9D2]/70 bg-white text-sm text-[#3F3F3F] focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]/20 focus:border-[#3F3F3F] transition-all"
              >
                <option value="">-- Selecciona una sucursal --</option>
                {activeBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {selectedBranchId && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Table count block */}
            <div className="lg:col-span-3 space-y-4">
              <div className="flex items-center justify-between bg-[#FAFAFA]/70 border border-[#D9D9D2]/30 p-4 rounded-xl">
                <span className="text-xs text-[#6B6B6B]">
                  Variantes en catálogo: <strong>{watchedItems.length}</strong>
                </span>
                <span className="text-xs text-[#6B6B6B] italic">
                  * Los conteos físicos se inicializan con el stock del sistema por defecto.
                </span>
              </div>

              <AuditTable isLoading={loadingStock} />
            </div>

            {/* Audit Summary sidebar (sticky) */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-[#D9D9D2]/30 p-6 shadow-sm space-y-6 sticky top-6">
                <h3 className="text-base font-bold text-[#3F3F3F] flex items-center gap-2 border-b border-[#D9D9D2]/40 pb-3">
                  <ClipboardList className="w-4 h-4 text-[#6B6B6B]" />
                  <span>Resumen de Conciliación</span>
                </h3>

                <div className="space-y-4 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[#6B6B6B]">Stock en Sistema</span>
                    <span className="font-semibold text-[#3F3F3F]">{summary.totalSystem} uds.</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#6B6B6B]">Stock Físico Contado</span>
                    <span className="font-semibold text-[#3F3F3F]">{summary.totalPhysical} uds.</span>
                  </div>

                  <div className="border-t border-[#D9D9D2]/40 pt-3 space-y-2">
                    <div className="flex justify-between items-center text-red-600 font-semibold">
                      <span>Total Faltantes</span>
                      <span>-{summary.totalFaltantes} uds.</span>
                    </div>
                    <div className="flex justify-between items-center text-emerald-600 font-semibold">
                      <span>Total Sobrantes</span>
                      <span>+{summary.totalSobrantes} uds.</span>
                    </div>
                  </div>

                  <div className="border-t border-[#D9D9D2]/40 pt-3 flex justify-between items-center">
                    <span className="text-xs font-bold text-[#3F3F3F] uppercase tracking-wider">Ajuste Neto</span>
                    <span className={`text-base font-extrabold ${
                      summary.totalPhysical - summary.totalSystem < 0 
                        ? 'text-red-600' 
                        : summary.totalPhysical - summary.totalSystem > 0 
                          ? 'text-emerald-600' 
                          : 'text-[#3F3F3F]'
                    }`}>
                      {summary.totalPhysical - summary.totalSystem > 0 ? '+' : ''}
                      {summary.totalPhysical - summary.totalSystem} uds.
                    </span>
                  </div>
                </div>

                {/* Submit buttons */}
                <div className="space-y-3 pt-4 border-t border-[#D9D9D2]/40">
                  <button
                    type="button"
                    disabled={submitting || watchedItems.length === 0}
                    onClick={handleSubmit((data) => onPreSubmit(data, 'PENDING'))}
                    className="w-full flex items-center justify-center gap-2 bg-white text-[#3F3F3F] border border-[#D9D9D2] py-2.5 rounded-xl hover:bg-[#FAFAFA] transition-all text-xs font-bold shadow-sm disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Guardar Borrador</span>
                  </button>

                  <button
                    type="button"
                    disabled={submitting || watchedItems.length === 0}
                    onClick={handleSubmit((data) => onPreSubmit(data, 'CONFIRMED'))}
                    className="w-full flex items-center justify-center gap-2 bg-[#3F3F3F] text-white py-3 rounded-xl hover:bg-[#1e1e1a] transition-all text-xs font-bold shadow-lg shadow-black/10 disabled:opacity-50"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Confirmar y Aplicar</span>
                  </button>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                      setSelectedBranchId('');
                      reset({ branchId: undefined, status: 'PENDING', items: [] });
                    }}
                    className="w-full py-2.5 text-center text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Modal de Confirmación de Ajustes de Stock (Seguridad) */}
        {isConfirmModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-[#1e1e1a]/40 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setIsConfirmModalOpen(false)}
            />

            {/* Modal Body */}
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-[#D9D9D2]/30 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 mx-auto">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-lg font-bold text-[#3F3F3F]">
                  ¿Confirmar Ajustes de Stock?
                </h3>
                <p className="text-xs text-[#6B6B6B] leading-relaxed">
                  Estás a punto de aplicar un ajuste físico definitivo de inventario. Esta acción **sincronizará de inmediato** los saldos en base de datos y generará asientos contables irreversibles en Kardex de tipo <strong className="text-[#3F3F3F]">AJUSTE</strong>.
                </p>
              </div>

              <div className="bg-[#FAFAFA] border border-[#D9D9D2]/40 p-4 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between items-center text-red-600 font-semibold">
                  <span>Unidades Faltantes:</span>
                  <span>-{summary.totalFaltantes} uds.</span>
                </div>
                <div className="flex justify-between items-center text-emerald-600 font-semibold">
                  <span>Unidades Sobrantes:</span>
                  <span>+{summary.totalSobrantes} uds.</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D9D9D2]/40">
                <button
                  type="button"
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#D9D9D2] text-[#3F3F3F] hover:bg-[#FAFAFA] transition-colors text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmModalAction}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-600/10"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Sí, Aplicar Ajuste</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </FormProvider>
  );
};

export default InventoryAuditPage;
