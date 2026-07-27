import React, { useState } from 'react';
import type { Delivery } from '../../types/logistics.types';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { logisticsService } from '../../services/logistics.service';
import { toast } from 'react-hot-toast';

interface RegisterFailedAttemptModalProps {
  delivery: Delivery | null;
  onClose: () => void;
  onRegistered: (deliveryId: number, updates: Partial<Delivery>) => void;
}

/**
 * Modal de intento fallido: motivo obligatorio + fecha de reprogramación opcional.
 * Se dispara al arrastrar una tarjeta a la columna FALLIDO del Kanban.
 */
export const RegisterFailedAttemptModal: React.FC<RegisterFailedAttemptModalProps> = ({
  delivery,
  onClose,
  onRegistered,
}) => {
  const [reason, setReason] = useState('');
  const [rescheduledFor, setRescheduledFor] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!delivery) return null;

  const priorAttempts = delivery.failedAttempts?.length ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setSubmitting(true);
    try {
      const attempt = await logisticsService.registerFailedAttempt(
        delivery.id,
        reason.trim(),
        rescheduledFor || undefined,
      );
      const newStatus = attempt.forcedReturn ? 'RETURNED' : 'AWAITING_CLIENT_DECISION';
      onRegistered(delivery.id, {
        status: newStatus,
        failedAttempts: [...(delivery.failedAttempts ?? []), attempt],
      });
      if (attempt.forcedReturn) {
        toast.error(`Intento N° ${attempt.attemptNumber}: se agotaron los intentos. El pedido fue devuelto y el stock reincorporado.`);
      } else {
        toast.success(`Intento N° ${attempt.attemptNumber} registrado. Se notificó al cliente para que decida reenvío o devolución.`);
      }
      setReason('');
      setRescheduledFor('');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al registrar el intento fallido.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full border border-gray-100 shadow-2xl p-6 relative flex flex-col gap-4 animate-scale-up">
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h3 className="font-extrabold text-gray-900 text-lg">Registrar Intento Fallido</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-black transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-gray-500 font-semibold leading-relaxed">
            Para mover el envío <strong>#{delivery.id}</strong> a <strong className="text-orange-600">FALLIDO</strong>,
            registra el motivo del intento de entrega:
          </p>

          {priorAttempts >= 2 && (
            <p className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 leading-snug">
              ⚠ Este envío ya acumula {priorAttempts} intentos fallidos. Al registrar otro,
              el pedido será devuelto automáticamente y el stock reincorporado.
            </p>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-gray-400">Motivo *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
              autoFocus
              placeholder="Ej: Cliente no se encontraba en el domicilio..."
              className="block w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-gray-400">Nueva fecha de entrega (opcional)</label>
            <input
              type="datetime-local"
              value={rescheduledFor}
              onChange={(e) => setRescheduledFor(e.target.value)}
              className="block w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!reason.trim() || submitting}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:pointer-events-none rounded-xl shadow-lg shadow-orange-500/10 hover:shadow-orange-500/25 transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Registrar y Mover'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
