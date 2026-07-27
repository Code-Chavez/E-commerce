import React from 'react';
import { Edit2, Trash2, Loader2, Building2 } from 'lucide-react';
import type { OperatingExpense } from '../../types/expenses';

interface Branch {
  id: number;
  name: string;
}

interface ExpensesTableProps {
  expenses: OperatingExpense[];
  loading: boolean;
  branches: Branch[];
  onEdit: (expense: OperatingExpense) => void;
  onDelete: (id: number) => void;
}

export const ExpensesTable: React.FC<ExpensesTableProps> = ({ expenses, loading, branches, onEdit, onDelete }) => {
  const getBranchName = (branchId: number) => {
    return branches.find(b => b.id === branchId)?.name || 'Desconocida';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#D9D9D2] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#FAFAFA] text-[#3F3F3F] uppercase text-xs font-bold tracking-wider border-b border-[#D9D9D2]/40">
              <th className="px-6 py-4">Descripción</th>
              <th className="px-6 py-4">Monto</th>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4">Sucursal</th>
              <th className="px-6 py-4">Fecha</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D9D9D2]/40">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#3F3F3F]" />
                </td>
              </tr>
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-[#6B6B6B]">
                  No se encontraron gastos registrados.
                </td>
              </tr>
            ) : (
              expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-[#FAFAFA] transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-[#3F3F3F]">{expense.description}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-[#3F3F3F]">
                    ${expense.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      expense.type === 'FIXED' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {expense.type === 'FIXED' ? 'Fijo' : 'Variable'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-[#3F3F3F]">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#6B6B6B]" />
                      {getBranchName(expense.branchId)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#6B6B6B]">
                    {formatDate(expense.date)}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => onEdit(expense)}
                      className="text-[#6B6B6B] hover:text-[#3F3F3F] transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(expense.id)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
