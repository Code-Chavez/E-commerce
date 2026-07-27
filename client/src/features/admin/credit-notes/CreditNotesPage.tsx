import React, { useState, useEffect } from 'react';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { CreditNotesTable } from './components/CreditNotesTable';
import { Ticket, Search, Loader2 } from 'lucide-react';
import { useCreditNotes } from '../hooks/useCreditNotes';

export const CreditNotesPage: React.FC = () => {
  useDocumentTitle('Notas de Crédito - D\'Mendoza');
  
  const [searchTerm, setSearchTerm] = useState('');
  const { creditNotes, loading, resendingId, fetchCreditNotes, resendPdf } = useCreditNotes();

  useEffect(() => {
    fetchCreditNotes();
  }, [fetchCreditNotes]);

  const filteredNotes = creditNotes.filter(note => 
    note.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (note.client?.name && note.client.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (note.client?.email && note.client.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-accent/10 text-brand-accent flex items-center justify-center shrink-0">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-brand-accent tracking-tight">Notas de Crédito y Vales</h2>
            <p className="text-xs text-brand-text mt-0.5">Gestione y reenvíe los comprobantes de saldo a favor emitidos por devoluciones.</p>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Filters bar */}
        <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por código o cliente..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:border-brand-accent focus:ring-1 focus:ring-brand-accent outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Loading state / Table wrapper */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-brand-accent" />
          </div>
        ) : (
          <CreditNotesTable 
            creditNotes={filteredNotes} 
            onResendPdf={resendPdf}
            resendingId={resendingId}
          />
        )}
      </div>
    </div>
  );
};

export default CreditNotesPage;
