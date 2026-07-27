import React, { useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';
import { handleNumericKeyDown, handleIntegerKeyDown } from '@/shared/validation/documentValidators';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Loader2, 
  FileText, 
  Building2, 
  User, 
  FileSignature, 
  Calculator, 
  Save, 
  AlertCircle,
  GitFork,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useStockEntries } from './hooks/useStockEntries';
import { useSuppliers } from '../suppliers/hooks/useSuppliers';
import { useBranches } from '../branches/hooks/useBranches';
import { stockEntrySchema } from './schemas/stockEntry.schema';
import type { StockEntryFormData } from './schemas/stockEntry.schema';
import { VariantAutocomplete } from './components/VariantAutocomplete';
import { DistributionPanel } from './components/DistributionPanel';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';


export const StockEntriesPage: React.FC = () => {
  useDocumentTitle('Registro de Ingreso de Mercadería');

  const { createStockEntry, submitting } = useStockEntries();
  const { suppliers, fetchSuppliers, loading: loadingSuppliers } = useSuppliers();
  const { branches, fetchBranches, loading: loadingBranches } = useBranches();

  const [expandedItemIndex, setExpandedItemIndex] = useState<number | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<StockEntryFormData>({
    resolver: yupResolver(stockEntrySchema) as any,
    defaultValues: {
      supplierId: undefined,
      branchId: undefined,
      invoiceNumber: '',
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  useEffect(() => {
    fetchSuppliers();
    fetchBranches();
  }, [fetchSuppliers, fetchBranches]);

  const selectedBranchId = watch('branchId');

  // Filters to find only active suppliers and branches
  const activeSuppliers = useMemo(() => suppliers.filter(s => s.isActive), [suppliers]);
  const activeBranches = useMemo(() => branches.filter(b => b.isActive), [branches]);

  const watchedItems = watch('items') || [];

  // Exclude variant IDs that are already added
  const addedVariantIds = useMemo(() => {
    return watchedItems.map(item => item.variantId);
  }, [watchedItems]);

  // Compute stats for summary card
  const summary = useMemo(() => {
    let totalItems = 0;
    let totalCost = 0;

    watchedItems.forEach(item => {
      const quantity = Number(item.quantity) || 0;
      const unitCost = Number(item.unitCost) || 0;
      totalItems += quantity;
      totalCost += quantity * unitCost;
    });

    return { totalItems, totalCost };
  }, [watchedItems]);

  const handleSelectVariant = (variant: { id: number; sku: string; productName: string; price: number; costPrice: number }) => {
    append({
      variantId: variant.id,
      sku: variant.sku,
      productName: variant.productName,
      quantity: 1,
      unitCost: variant.costPrice || 0, // Precargar con el precio de costo, nunca con el de venta
      distributions: [],
    });
  };

  const onSubmit = async (data: StockEntryFormData) => {
    // Construct distributionItems array
    const distributionItems: Array<{ branchId: number; variantId: number; quantity: number }> = [];
    (data.items || []).forEach(item => {
      if (item.distributions) {
        item.distributions.forEach(dist => {
          if (dist.quantity > 0) {
            distributionItems.push({
              branchId: Number(dist.branchId),
              variantId: Number(item.variantId),
              quantity: Number(dist.quantity),
            });
          }
        });
      }
    });

    // Form is already validated by Yup. Format payload to exact numbers
    const payload = {
      supplierId: Number(data.supplierId),
      invoiceNumber: data.invoiceNumber,
      branchId: Number(data.branchId),
      items: (data.items || []).map(item => ({
        variantId: Number(item.variantId),
        quantity: Number(item.quantity),
        unitCost: Number(item.unitCost),
      })),
      distributionItems,
    };

    const success = await createStockEntry(payload);
    if (success) {
      setExpandedItemIndex(null);
      reset({
        supplierId: undefined,
        branchId: undefined,
        invoiceNumber: '',
        items: [],
      });
    }
  };

  const isLoadingData = loadingSuppliers || loadingBranches;

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
            Ingreso de Mercadería
          </h1>
          <p className="text-sm text-[#6B6B6B] mt-1 max-w-2xl">
            Registra una nueva entrada de mercadería de proveedores. Esta acción es transaccional y actualizará el inventario actual de la sucursal elegida y creará asientos automáticos en Kardex.
          </p>
        </div>
      </div>

      {isLoadingData ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#3F3F3F] animate-spin" />
          <p className="text-sm text-[#6B6B6B] mt-2">Cargando sucursales y proveedores...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Form left/middle areas */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Metadata Card */}
            <div className="bg-white rounded-2xl border border-[#D9D9D2]/30 p-6 shadow-sm space-y-5">
              <h3 className="text-base font-bold text-[#3F3F3F] flex items-center gap-2 border-b border-[#D9D9D2]/40 pb-3">
                <FileSignature className="w-4 h-4 text-[#6B6B6B]" />
                <span>Datos Generales del Ingreso</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Supplier Selection */}
                <div>
                  <label htmlFor="supplierId" className="block text-xs font-bold text-[#3F3F3F] uppercase tracking-wider mb-2">
                    Proveedor *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B6B6B]">
                      <User className="w-4 h-4" />
                    </div>
                    <select
                      id="supplierId"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-[#FAFAFA] text-sm text-[#3F3F3F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]/20 focus:border-[#3F3F3F] transition-all appearance-none ${
                        errors.supplierId ? 'border-red-500 ring-1 ring-red-500/20' : 'border-[#D9D9D2]/70'
                      }`}
                      {...register('supplierId')}
                    >
                      <option value="">Selecciona un proveedor activo</option>
                      {activeSuppliers.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.razonSocial} (RUC: {s.ruc})
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.supplierId && (
                    <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.supplierId.message}</p>
                  )}
                </div>

                {/* Branch Selection */}
                <div>
                  <label htmlFor="branchId" className="block text-xs font-bold text-[#3F3F3F] uppercase tracking-wider mb-2">
                    Sucursal Destino *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B6B6B]">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <select
                      id="branchId"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-[#FAFAFA] text-sm text-[#3F3F3F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]/20 focus:border-[#3F3F3F] transition-all appearance-none ${
                        errors.branchId ? 'border-red-500 ring-1 ring-red-500/20' : 'border-[#D9D9D2]/70'
                      }`}
                      {...register('branchId')}
                    >
                      <option value="">Selecciona la sucursal de destino</option>
                      {activeBranches.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.branchId && (
                    <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.branchId.message}</p>
                  )}
                </div>

                {/* Invoice Number */}
                <div className="md:col-span-2">
                  <label htmlFor="invoiceNumber" className="block text-xs font-bold text-[#3F3F3F] uppercase tracking-wider mb-2">
                    Número de Comprobante (Factura/Boleta) *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B6B6B]">
                      <FileText className="w-4 h-4" />
                    </div>
                    <input
                      id="invoiceNumber"
                      type="text"
                      placeholder="Ej. F001-000123"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-[#FAFAFA] text-sm text-[#3F3F3F] placeholder-[#6B6B6B]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]/20 focus:border-[#3F3F3F] transition-all ${
                        errors.invoiceNumber ? 'border-red-500 ring-1 ring-red-500/20' : 'border-[#D9D9D2]/70'
                      }`}
                      {...register('invoiceNumber')}
                    />
                  </div>
                  {errors.invoiceNumber && (
                    <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.invoiceNumber.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Items Card */}
            <div className="bg-white rounded-2xl border border-[#D9D9D2]/30 p-6 shadow-sm space-y-6">
              <div className="border-b border-[#D9D9D2]/40 pb-4">
                <h3 className="text-base font-bold text-[#3F3F3F] flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#6B6B6B]" />
                  <span>Ítems del Ingreso</span>
                </h3>
                <p className="text-xs text-[#6B6B6B] mt-1">
                  Busca y agrega variantes del catálogo de productos e ingresa las cantidades adquiridas y costos unitarios de compra.
                </p>
              </div>

              {/* Autocomplete Input */}
              <VariantAutocomplete 
                onSelect={handleSelectVariant} 
                excludeVariantIds={addedVariantIds}
              />

              {errors.items && !Array.isArray(errors.items) && (
                <div className="flex items-center gap-2 text-xs text-red-500 font-medium bg-red-50 border border-red-200/50 p-3 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errors.items.message}</span>
                </div>
              )}

              {/* Items List */}
              {fields.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center bg-[#FAFAFA] rounded-2xl border border-dashed border-[#D9D9D2]">
                  <p className="text-xs text-[#6B6B6B]">
                    No se han añadido ítems a la factura. Utiliza el buscador superior para comenzar.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {fields.map((field, index) => {
                    const itemError = errors.items?.[index];
                    const isExpanded = expandedItemIndex === index;

                    return (
                      <div 
                        key={field.id} 
                        className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                          isExpanded 
                            ? 'border-[#3F3F3F] bg-white shadow-md' 
                            : 'border-[#D9D9D2]/40 bg-white/40 hover:bg-white shadow-sm'
                        }`}
                      >
                        {/* Main Item Row */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 group">
                          {/* Title & SKU info */}
                          <div className="flex-1 min-w-0">
                            <span className="block font-bold text-xs text-[#3F3F3F] truncate">{field.sku}</span>
                            <span className="block text-[11px] text-[#6B6B6B] mt-0.5 truncate">{field.productName}</span>
                          </div>

                          {/* Numeric Fields */}
                          <div className="flex items-center gap-3 shrink-0">
                            
                            {/* Quantity */}
                            <div className="w-20">
                              <label className="block text-[9px] font-bold text-[#6B6B6B] uppercase tracking-wider mb-1">
                                Cant. *
                              </label>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                className={`w-full px-2 py-1 text-xs text-center font-semibold rounded-lg border bg-white focus:outline-none focus:ring-1 focus:ring-[#3F3F3F] focus:border-[#3F3F3F] transition-all ${
                                  itemError?.quantity ? 'border-red-500 ring-1 ring-red-500/20' : 'border-[#D9D9D2]'
                                }`}
                                onKeyDown={handleIntegerKeyDown}
                                {...register(`items.${index}.quantity` as const, { 
                                  valueAsNumber: true,
                                  onChange: (e) => {
                                    const val = parseInt(e.target.value);
                                    if (val < 0) e.target.value = '';
                                  } 
                                })}
                              />
                              {itemError?.quantity && (
                                <p className="text-[9px] text-red-500 mt-0.5">{itemError.quantity.message}</p>
                              )}
                            </div>

                            {/* Unit Cost */}
                            <div className="w-24">
                              <label className="block text-[9px] font-bold text-[#6B6B6B] uppercase tracking-wider mb-1">
                                Costo Unit. *
                              </label>
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                className={`w-full px-2 py-1 text-xs text-center font-semibold rounded-lg border bg-white focus:outline-none focus:ring-1 focus:ring-[#3F3F3F] focus:border-[#3F3F3F] transition-all ${
                                  itemError?.unitCost ? 'border-red-500 ring-1 ring-red-500/20' : 'border-[#D9D9D2]'
                                }`}
                                onKeyDown={handleNumericKeyDown}
                                {...register(`items.${index}.unitCost` as const, { 
                                  valueAsNumber: true,
                                  onChange: (e) => {
                                    const val = parseFloat(e.target.value);
                                    if (val < 0) e.target.value = '';
                                  }
                                })}
                              />
                              {itemError?.unitCost && (
                                <p className="text-[9px] text-red-500 mt-0.5">{itemError.unitCost.message}</p>
                              )}
                            </div>

                            {/* Total cost for item */}
                            <div className="w-20 text-right pr-1">
                              <span className="block text-[9px] font-bold text-[#6B6B6B] uppercase tracking-wider mb-1">
                                Total
                              </span>
                              <span className="text-xs font-bold text-[#3F3F3F]">
                                S/. {((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.unitCost || 0)).toFixed(2)}
                              </span>
                            </div>

                            {/* Distribute Button */}
                            <button
                              type="button"
                              disabled={!selectedBranchId}
                              onClick={() => setExpandedItemIndex(isExpanded ? null : index)}
                              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border transition-all ${
                                !selectedBranchId 
                                  ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                                  : isExpanded
                                    ? 'bg-[#3F3F3F] text-white border-[#3F3F3F]'
                                    : 'bg-white text-[#3F3F3F] border-[#D9D9D2] hover:bg-[#FAFAFA]'
                              }`}
                              title={!selectedBranchId ? 'Selecciona una sucursal destino en la cabecera primero' : 'Distribuir Mercadería'}
                            >
                              <GitFork className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Distribuir</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>

                            {/* Delete Action */}
                            <button
                              type="button"
                              onClick={() => {
                                if (isExpanded) setExpandedItemIndex(null);
                                remove(index);
                              }}
                              className="p-1.5 text-[#6B6B6B] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Quitar Ítem"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Collapsible Distribution Panel */}
                        {isExpanded && selectedBranchId && (
                          <div className="border-t border-[#D9D9D2]/30 px-4 pb-4">
                            <DistributionPanel
                              control={control}
                              watch={watch}
                              setValue={setValue}
                              itemIndex={index}
                              branches={branches}
                              primaryBranchId={Number(selectedBranchId)}
                              totalQuantity={Number(watchedItems[index]?.quantity) || 0}
                              errors={itemError}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Form Summary Sidebar (right area) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-[#D9D9D2]/30 p-6 shadow-sm space-y-6 sticky top-6">
              <h3 className="text-base font-bold text-[#3F3F3F] flex items-center gap-2 border-b border-[#D9D9D2]/40 pb-3">
                <Calculator className="w-4 h-4 text-[#6B6B6B]" />
                <span>Resumen del Documento</span>
              </h3>

              <div className="space-y-3.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#6B6B6B]">Total de Variantes</span>
                  <span className="font-semibold text-[#3F3F3F]">{fields.length}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#6B6B6B]">Total de Unidades</span>
                  <span className="font-semibold text-[#3F3F3F]">{summary.totalItems}</span>
                </div>
                <div className="border-t border-[#D9D9D2]/40 pt-3 flex justify-between items-center">
                  <span className="text-xs font-bold text-[#3F3F3F] uppercase tracking-wider">Costo Total</span>
                  <span className="text-xl font-extrabold text-[#3F3F3F]">
                    S/. {summary.totalCost.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* CTA Action button */}
              <button
                type="submit"
                disabled={submitting || fields.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-[#3F3F3F] text-white py-3.5 rounded-xl hover:bg-[#1e1e1a] transition-all text-sm font-semibold shadow-lg shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando Ingreso...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Registrar Ingreso</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </form>
      )}

    </div>
  );
};

export default StockEntriesPage;
