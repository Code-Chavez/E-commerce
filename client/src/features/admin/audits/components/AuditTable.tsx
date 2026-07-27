import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { ClipboardList, TrendingDown, TrendingUp, Equal } from 'lucide-react';
import type { AuditFormData } from '../schemas/audit.schema';

interface AuditTableProps {
  isLoading: boolean;
}

export const AuditTable: React.FC<AuditTableProps> = ({ isLoading }) => {
  const { control, register, watch, formState: { errors } } = useFormContext<AuditFormData>();
  
  const { fields } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items') || [];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-[#D9D9D2]/30 shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3F3F3F]" />
        <p className="text-sm text-[#6B6B6B] mt-2">Cargando existencias actuales de la sucursal...</p>
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-[#D9D9D2]/30 shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D9D9D2]/20 text-[#6B6B6B] mb-4">
          <ClipboardList className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-[#3F3F3F]">Sin variantes para auditar</h3>
        <p className="text-sm text-[#6B6B6B] mt-1 max-w-sm">
          Selecciona una sucursal con variantes de producto o existencias activas para dar inicio a la toma de inventario físico.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#D9D9D2]/30 bg-white shadow-sm">
      <table className="w-full text-left border-collapse min-w-[700px]">
        <thead>
          <tr className="bg-[#FAFAFA] border-b border-[#D9D9D2]/40">
            <th className="py-4 px-6 text-xs font-bold text-[#3F3F3F] uppercase tracking-wider">
              Variante / SKU
            </th>
            <th className="py-4 px-6 text-xs font-bold text-[#3F3F3F] uppercase tracking-wider">
              Producto
            </th>
            <th className="py-4 px-6 text-xs font-bold text-[#3F3F3F] uppercase tracking-wider text-center w-32">
              Stock Sistema
            </th>
            <th className="py-4 px-6 text-xs font-bold text-[#3F3F3F] uppercase tracking-wider text-center w-36">
              Conteo Físico *
            </th>
            <th className="py-4 px-6 text-xs font-bold text-[#3F3F3F] uppercase tracking-wider text-center w-32">
              Diferencia
            </th>
            <th className="py-4 px-6 text-xs font-bold text-[#3F3F3F] uppercase tracking-wider text-center w-36">
              Estado
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#D9D9D2]/20">
          {fields.map((field, index) => {
            const systemQty = Number(field.systemQty) || 0;
            const physicalQty = Number(watchedItems[index]?.physicalQty) ?? 0;
            const difference = physicalQty - systemQty;
            const itemError = errors.items?.[index]?.physicalQty;

            return (
              <tr 
                key={field.id}
                className={`transition-colors ${
                  difference < 0 
                    ? 'bg-red-50/10 hover:bg-red-50/20' 
                    : difference > 0 
                      ? 'bg-emerald-50/10 hover:bg-emerald-50/20' 
                      : 'hover:bg-[#FAFAFA]/50'
                }`}
              >
                {/* SKU */}
                <td className="py-4 px-6">
                  <span className="font-mono text-xs font-bold text-[#3F3F3F]">{field.sku}</span>
                  <span className="text-[10px] text-[#6B6B6B] block mt-0.5">ID: #{field.variantId}</span>
                </td>

                {/* Producto */}
                <td className="py-4 px-6 text-sm text-[#3F3F3F] font-semibold">
                  {field.productName}
                </td>

                {/* Stock Sistema */}
                <td className="py-4 px-6 text-center font-bold text-sm text-[#3F3F3F]">
                  {systemQty}
                </td>

                {/* Conteo Físico Input */}
                <td className="py-4 px-6">
                  <div className="w-28 mx-auto">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className={`w-full px-2.5 py-1.5 text-xs text-center font-extrabold rounded-lg border bg-white focus:outline-none focus:ring-1 focus:ring-[#3F3F3F] focus:border-[#3F3F3F] transition-all ${
                        itemError ? 'border-red-500 ring-1 ring-red-500/20' : 'border-[#D9D9D2]'
                      }`}
                      {...register(`items.${index}.physicalQty` as const, { valueAsNumber: true })}
                    />
                    {itemError && (
                      <p className="text-[9px] text-red-500 mt-0.5 text-center font-semibold">{itemError.message}</p>
                    )}
                  </div>
                </td>

                {/* Diferencia calculada */}
                <td className="py-4 px-6 text-center font-extrabold text-sm">
                  <span className={
                    difference < 0 
                      ? 'text-red-600' 
                      : difference > 0 
                        ? 'text-emerald-600' 
                        : 'text-[#3F3F3F]'
                  }>
                    {difference > 0 ? `+${difference}` : difference}
                  </span>
                </td>

                {/* Indicador de Estado */}
                <td className="py-4 px-6 text-center">
                  {difference < 0 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
                      <TrendingDown className="w-3 h-3" />
                      Faltante
                    </span>
                  ) : difference > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <TrendingUp className="w-3 h-3" />
                      Sobrante
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#3F3F3F]/5 text-[#3F3F3F] border border-[#D9D9D2]/40">
                      <Equal className="w-3 h-3 text-[#6B6B6B]" />
                      Exacto
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
