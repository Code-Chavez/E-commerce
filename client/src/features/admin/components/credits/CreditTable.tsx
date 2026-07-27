import React from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import type { Credit } from '../../types/credit.types';

interface CreditTableProps {
  credits: Credit[];
  loading: boolean;
  onPayClick: (credit: Credit) => void;
}

export const isNearDueDate = (dueDateStr: string): boolean => {
  const dueDate = new Date(dueDateStr);
  const today = new Date();
  dueDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 7;
};

export const CreditTable: React.FC<CreditTableProps> = ({ credits, loading, onPayClick }) => {
  if (loading) {
    return (
      <div className="p-8 text-center text-[#6B6B6B]">
        Cargando créditos del cliente...
      </div>
    );
  }

  if (credits.length === 0) {
    return (
      <div className="p-8 text-center text-gray-400 italic text-sm">
        No hay créditos registrados para este cliente.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#FAFAFA] text-[#3F3F3F] uppercase text-xs font-bold tracking-wider border-b border-[#D9D9D2]/40">
            <th className="px-6 py-4">ID Crédito</th>
            <th className="px-6 py-4">Monto Total</th>
            <th className="px-6 py-4">Saldo Pendiente</th>
            <th className="px-6 py-4">Fecha Vencimiento</th>
            <th className="px-6 py-4">Cuotas</th>
            <th className="px-6 py-4 text-right">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#D9D9D2]/40 text-[#3F3F3F]">
          {credits.map((credit) => {
            const warning = isNearDueDate(credit.dueDate) && credit.pendingBalance > 0;
            const formattedDate = new Date(credit.dueDate).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });

            return (
              <tr key={credit.id} className="hover:bg-[#FAFAFA]/50 transition-colors">
                <td className="px-6 py-4 font-mono text-xs font-bold text-gray-500">
                  {credit.id}
                </td>
                <td className="px-6 py-4 font-semibold">
                  {`$${credit.totalAmount.toFixed(2)}`}
                </td>
                <td className={`px-6 py-4 font-bold ${warning ? 'text-rose-600' : 'text-emerald-600'}`}>
                  <div className="flex items-center gap-1.5">
                    {`$${credit.pendingBalance.toFixed(2)}`}
                    {warning && (
                      <span className="text-rose-600" title="Próximo a vencer o vencido">
                        <AlertCircle className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-xs font-semibold text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {formattedDate}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-500">
                  {credit.installments}
                </td>
                <td className="px-6 py-4 text-right">
                  {credit.pendingBalance > 0 ? (
                    <button
                      onClick={() => onPayClick(credit)}
                      className="px-3.5 py-1.5 bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 text-[#F7F7F5] text-xs font-bold rounded-lg transition-all shadow-sm cursor-pointer hover:scale-[1.02]"
                    >
                      Abonar
                    </button>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-400 border border-gray-200/50">
                      Pagado
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
