import { useState, useCallback } from 'react';
import { creditNotesService } from '../services/creditNotesService';
import type { CreditNote } from '../types/credit-note';
import toast from 'react-hot-toast';

export const useCreditNotes = () => {
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [resendingId, setResendingId] = useState<number | null>(null);

  const fetchCreditNotes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await creditNotesService.getCreditNotes();
      setCreditNotes(data);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Error al cargar las notas de crédito';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const resendPdf = async (id: number) => {
    setResendingId(id);
    try {
      await creditNotesService.resendPdf(id);
      toast.success('PDF reenviado con éxito al cliente');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Error al reenviar el PDF por correo';
      toast.error(msg);
    } finally {
      setResendingId(null);
    }
  };

  return {
    creditNotes,
    loading,
    resendingId,
    fetchCreditNotes,
    resendPdf,
  };
};
