import React, { useEffect } from 'react';
import { useFieldArray } from 'react-hook-form';
import type { Control, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Building2, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Branch } from '../../branches/hooks/useBranches';
import type { StockEntryFormData } from '../schemas/stockEntry.schema';
import { handleIntegerKeyDown } from '@/shared/validation/documentValidators';

interface DistributionPanelProps {
  control: Control<StockEntryFormData>;
  watch: UseFormWatch<StockEntryFormData>;
  setValue: UseFormSetValue<StockEntryFormData>;
  itemIndex: number;
  branches: Branch[];
  primaryBranchId: number;
  totalQuantity: number;
  errors?: any;
}

export const DistributionPanel: React.FC<DistributionPanelProps> = ({
  control,
  watch,
  setValue,
  itemIndex,
  branches,
  primaryBranchId,
  totalQuantity,
  errors,
}) => {
  const { fields, replace } = useFieldArray({
    control,
    name: `items.${itemIndex}.distributions` as const,
  });

  const watchedDistributions = watch(`items.${itemIndex}.distributions`) || [];

  // Populate distributions list when branches change or are initialized
  useEffect(() => {
    const secondaryBranches = branches.filter((b) => b.isActive && b.id !== Number(primaryBranchId));
    
    // Map current values if they exist, or fallback to zero
    const currentDistValues = new Map(watchedDistributions.map(d => [d.branchId, d.quantity]));

    const initialDistributions = secondaryBranches.map((b) => ({
      branchId: b.id,
      branchName: b.name,
      quantity: currentDistValues.get(b.id) || 0,
    }));

    replace(initialDistributions);
  }, [branches, primaryBranchId, replace]);

  // Calculate sum of secondary branches
  const sumOfDistributed = watchedDistributions.reduce(
    (acc, curr) => acc + (Number(curr.quantity) || 0),
    0
  );

  const remainingQuantity = Math.max(0, totalQuantity - sumOfDistributed);
  const exceedsTotal = sumOfDistributed > totalQuantity;

  // Find the primary branch name
  const primaryBranchName = branches.find((b) => b.id === Number(primaryBranchId))?.name || 'Sucursal Principal';

  return (
    <div className="mt-4 p-5 rounded-xl border border-[#D9D9D2]/40 bg-[#FAFAFA]/70 space-y-4">
      <div className="flex items-center justify-between border-b border-[#D9D9D2]/30 pb-3">
        <div>
          <h4 className="text-xs font-extrabold text-[#3F3F3F] uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-[#6B6B6B]" />
            <span>Distribución entre Sucursales</span>
          </h4>
          <p className="text-[11px] text-[#6B6B6B] mt-0.5">
            Distribuye las {totalQuantity} unidades ingresadas a otras sedes. El saldo irá automáticamente a la sede receptora principal.
          </p>
        </div>
      </div>

      {/* Grid of branches */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Primary Receiving Branch (calculated read-only) */}
        <div className="p-3.5 rounded-xl border border-dashed border-[#D9D9D2] bg-white flex items-center justify-between">
          <div>
            <span className="block font-bold text-xs text-[#3F3F3F]">{primaryBranchName}</span>
            <span className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider mt-0.5 block">
              Receptora Principal (Remanente)
            </span>
          </div>
          <div className="text-right">
            <span className="block text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider mb-1">
              Asignado
            </span>
            <span className="text-sm font-extrabold text-emerald-600">{remainingQuantity} uds.</span>
          </div>
        </div>

        {/* Secondary Branches Input Fields */}
        {fields.map((field, idx) => {
          const fieldError = errors?.distributions?.[idx]?.quantity;

          return (
            <div 
              key={field.id}
              className="p-3.5 rounded-xl border border-[#D9D9D2]/40 bg-white flex items-center justify-between hover:border-[#3F3F3F]/30 transition-all"
            >
              <div>
                <span className="block font-bold text-xs text-[#3F3F3F]">{field.branchName}</span>
                <span className="text-[10px] text-[#6B6B6B] mt-0.5 block">Sucursal Secundaria</span>
              </div>
              
              <div className="w-24 text-right">
                <input
                  type="number"
                  min="0"
                  max={totalQuantity}
                  step="1"
                  className={`w-full px-2.5 py-1.5 text-xs text-center font-bold rounded-lg border bg-[#FAFAFA] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#3F3F3F] focus:border-[#3F3F3F] transition-all ${
                    fieldError ? 'border-red-500 ring-1 ring-red-500/20' : 'border-[#D9D9D2]'
                  }`}
                  value={watchedDistributions[idx]?.quantity || 0}
                  onKeyDown={handleIntegerKeyDown}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (val < 0) return;
                    setValue(
                      `items.${itemIndex}.distributions.${idx}.quantity` as const,
                      isNaN(val) ? 0 : val,
                      { shouldValidate: true }
                    );
                  }}
                />
                {fieldError && (
                  <p className="text-[9px] text-red-500 mt-0.5 text-left">{fieldError.message}</p>
                )}
              </div>
            </div>
          );
        })}

      </div>

      {/* Validation status widget */}
      <div className="pt-2">
        {exceedsTotal ? (
          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200/50 p-3 rounded-xl">
            <AlertTriangle className="w-4 h-4 shrink-0 animate-bounce" />
            <span className="font-semibold">
              Error: La suma distribuida ({sumOfDistributed} uds.) supera la cantidad total ingresada ({totalQuantity} uds.) por {sumOfDistributed - totalQuantity} unidades.
            </span>
          </div>
        ) : sumOfDistributed > 0 ? (
          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/50 p-3 rounded-xl">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              Distribución balanceada: <strong>{sumOfDistributed}</strong> unidades asignadas a sucursales secundarias y <strong>{remainingQuantity}</strong> unidades remanentes a la principal.
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-[#6B6B6B] bg-white border border-[#D9D9D2]/30 p-3 rounded-xl">
            <Info className="w-4 h-4 shrink-0 text-[#6B6B6B]/60" />
            <span>El 100% de las unidades ({totalQuantity}) se asignarán por defecto a la sucursal principal.</span>
          </div>
        )}
      </div>

    </div>
  );
};
