import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { X, Loader2, Landmark, HelpCircle } from 'lucide-react';
import { cashRegisterSchema } from '../schemas/cashRegister.schema';
import type { CashRegisterFormData } from '../schemas/cashRegister.schema';
import type { CashRegister } from '../hooks/useCashRegisters';
import type { Branch } from '../hooks/useBranches';

interface CashRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CashRegisterFormData) => Promise<any>;
  editingRegister: CashRegister | null;
  submitting: boolean;
  branches: Branch[];
}

export const CashRegisterModal: React.FC<CashRegisterModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingRegister,
  submitting,
  branches,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CashRegisterFormData>({
    resolver: yupResolver(cashRegisterSchema),
    defaultValues: {
      branchId: 0,
      name: '',
    },
  });

  useEffect(() => {
    if (editingRegister) {
      reset({
        branchId: editingRegister.branchId,
        name: editingRegister.name,
      });
    } else {
      reset({
        branchId: branches.length > 0 ? branches[0].id : 0,
        name: '',
      });
    }
  }, [editingRegister, reset, branches]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col border border-[#D9D9D2]/30 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D9D9D2]/40 bg-[#F7F7F5]">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#D9D9D2]/40 text-[#3F3F3F] rounded-lg">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#3F3F3F]">
                {editingRegister ? 'Editar Caja Registradora' : 'Nueva Caja Registradora'}
              </h2>
              <p className="text-xs text-[#6B6B6B]">
                {editingRegister ? 'Actualiza los datos de la caja.' : 'Crea una caja registradora vinculada a una sucursal.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#D9D9D2]/40 text-[#6B6B6B] hover:text-[#3F3F3F] rounded-full transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          
          {/* Branch Selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#3F3F3F] flex items-center gap-1.5">
              Sucursal Vinculada <span className="text-rose-500">*</span>
            </label>
            <select
              disabled={!!editingRegister}
              {...register('branchId', { valueAsNumber: true })}
              className={`w-full px-4 py-2 bg-[#F7F7F5] border rounded-xl outline-none transition-all duration-200 text-[#3F3F3F] focus:ring-1 focus:ring-[#3F3F3F] font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                errors.branchId ? 'border-rose-400 focus:border-rose-400' : 'border-[#D9D9D2] focus:border-[#3F3F3F]'
              }`}
            >
              <option value="0">Selecciona una sucursal...</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            {errors.branchId && (
              <p className="text-xs text-rose-500 font-medium mt-1">{errors.branchId.message}</p>
            )}
          </div>

          {/* Name Input */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#3F3F3F] flex items-center gap-1.5">
              Nombre de la Caja <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder="Ej. Caja Principal - Sede Larco"
              className={`w-full px-4 py-2 bg-[#F7F7F5] border rounded-xl outline-none transition-all duration-200 text-[#3F3F3F] placeholder-[#6B6B6B]/40 focus:ring-1 focus:ring-[#3F3F3F] ${
                errors.name ? 'border-rose-400 focus:border-rose-400' : 'border-[#D9D9D2] focus:border-[#3F3F3F]'
              }`}
            />
            {errors.name && (
              <p className="text-xs text-rose-500 font-medium mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Help Tip */}
          <div className="p-3 bg-[#F7F7F5] rounded-xl border border-[#D9D9D2]/30 flex items-start gap-2 text-xs text-[#6B6B6B] leading-tight">
            <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              Una vez creada, los vendedores podrán seleccionar esta caja registradora en el POS para iniciar sus turnos de ventas.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D9D9D2]/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#3F3F3F] font-semibold hover:bg-[#D9D9D2]/40 rounded-xl transition-colors duration-200 text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 text-white font-semibold px-5 py-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm text-sm disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingRegister ? 'Actualizar Caja' : 'Crear Caja'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
