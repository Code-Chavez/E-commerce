import React from 'react';
import type { CreditNote } from '../../types/credit-note';
import { Mail } from 'lucide-react';

interface CreditNotesTableProps {
  creditNotes: CreditNote[];
  onResendPdf: (id: number) => void;
  resendingId: number | null;
}

export const CreditNotesTable: React.FC<CreditNotesTableProps> = ({
  creditNotes,
  onResendPdf,
  resendingId,
}) => {
  const formatCurrency = (amount: number) => {
    return `S/ ${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase bg-gray-50/50">
            <th className="px-6 py-4">Código</th>
            <th className="px-6 py-4">Cliente</th>
            <th className="px-6 py-4">Monto</th>
            <th className="px-6 py-4">Emisión</th>
            <th className="px-6 py-4">Estado</th>
            <th className="px-6 py-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
          {creditNotes.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                No hay notas de crédito emitidas.
              </td>
            </tr>
          ) : (
            creditNotes.map((note) => {
              const isUsed = !!note.usedAt;
              return (
                <tr key={note.id} className="hover:bg-gray-50/40 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-brand-accent text-xs">
                    {note.code}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900">
                        {note.client?.name || 'Cliente sin nombre'}
                      </span>
                      <span className="text-xs text-gray-400">{note.client?.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {formatCurrency(note.amount)}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {formatDate(note.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        isUsed
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}
                    >
                      {isUsed ? 'Usada' : 'Disponible'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onResendPdf(note.id)}
                      disabled={resendingId === note.id}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-brand-accent hover:bg-brand-accent/90 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all`}
                      title="Reenviar PDF por correo"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      {resendingId === note.id ? 'Reenviando...' : 'Reenviar PDF'}
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
