import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import type { OperatingExpense, CreateOperatingExpenseDTO, UpdateOperatingExpenseDTO, ExpenseType } from '../../types/expenses';

import { handleNumericKeyDown } from '@/shared/validation/documentValidators';

interface Branch {
  id: number;
  name: string;
}

interface ExpenseFormProps {
  initialData?: OperatingExpense | null;
  branches: Branch[];
  onSubmit: (data: any) => Promise<boolean>;
  onCancel: () => void;
  submitting: boolean;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ initialData, branches, onSubmit, onCancel, submitting }) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'FIXED' as ExpenseType,
    branchId: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        description: initialData.description,
        amount: initialData.amount.toString(),
        type: initialData.type,
        branchId: initialData.branchId.toString(),
        date: initialData.date.split('T')[0]
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = initialData 
      ? {
          description: formData.description,
          amount: parseFloat(formData.amount)
        } as UpdateOperatingExpenseDTO
      : {
          description: formData.description,
          amount: parseFloat(formData.amount),
          type: formData.type,
          branchId: parseInt(formData.branchId, 10),
          date: new Date(formData.date).toISOString()
        } as CreateOperatingExpenseDTO;
        
    const success = await onSubmit(payload);
    if (success && !initialData) {
      setFormData({
        description: '',
        amount: '',
        type: 'FIXED',
        branchId: '',
        date: new Date().toISOString().split('T')[0]
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-[#D9D9D2]/40">
          <h2 className="text-xl font-bold text-[#3F3F3F]">
            {initialData ? 'Editar Gasto' : 'Nuevo Gasto Operativo'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-bold text-[#3F3F3F]">Descripción</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border border-[#D9D9D2] rounded-xl outline-none focus:border-[#3F3F3F] transition-colors"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ej. Alquiler mensual"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-[#3F3F3F]">Monto ($)</label>
            <input
              type="number"
              required
              step="0.01"
              min="0"
              className="w-full px-4 py-2 border border-[#D9D9D2] rounded-xl outline-none focus:border-[#3F3F3F] transition-colors"
              value={formData.amount}
              onKeyDown={handleNumericKeyDown}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (val < 0) return;
                setFormData({ ...formData, amount: e.target.value });
              }}
              placeholder="0.00"
            />
          </div>

          {!initialData && (
            <>
              <div className="space-y-1">
                <label className="text-sm font-bold text-[#3F3F3F]">Tipo de Gasto</label>
                <select
                  required
                  className="w-full px-4 py-2 border border-[#D9D9D2] rounded-xl outline-none focus:border-[#3F3F3F] transition-colors bg-white"
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value as ExpenseType })}
                >
                  <option value="FIXED">Fijo</option>
                  <option value="VARIABLE">Variable</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-[#3F3F3F]">Sucursal</label>
                <select
                  required
                  className="w-full px-4 py-2 border border-[#D9D9D2] rounded-xl outline-none focus:border-[#3F3F3F] transition-colors bg-white"
                  value={formData.branchId}
                  onChange={e => setFormData({ ...formData, branchId: e.target.value })}
                >
                  <option value="">Selecciona sucursal</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-[#3F3F3F]">Fecha</label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-2 border border-[#D9D9D2] rounded-xl outline-none focus:border-[#3F3F3F] transition-colors"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="flex-1 px-4 py-2 border border-[#D9D9D2] text-[#3F3F3F] font-bold rounded-xl hover:bg-[#FAFAFA] transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 bg-[#3F3F3F] text-[#F7F7F5] font-bold px-4 py-2 rounded-xl hover:bg-[#3F3F3F]/90 transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
