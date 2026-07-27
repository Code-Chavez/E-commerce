import React, { useState } from 'react';
import type { Delivery } from '../../types/logistics.types';
import { KeyRound, X, Loader2, Camera } from 'lucide-react';
import { logisticsService } from '../../services/logistics.service';
import { toast } from 'react-hot-toast';

interface ConfirmDeliveryModalProps {
  delivery: Delivery | null;
  onClose: () => void;
  onConfirmed: (deliveryId: number, updates: Partial<Delivery>) => void;
}

/**
 * Modal de confirmación de entrega: PIN de 6 dígitos obligatorio + foto opcional.
 * Se dispara al arrastrar una tarjeta a la columna ENTREGADO del Kanban.
 */
export const ConfirmDeliveryModal: React.FC<ConfirmDeliveryModalProps> = ({
  delivery,
  onClose,
  onConfirmed,
}) => {
  const [pin, setPin] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [confirming, setConfirming] = useState(false);

  if (!delivery) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim().length !== 6) return;

    setConfirming(true);
    try {
      const result = await logisticsService.confirmDeliveryPin(delivery.id, pin.trim());

      let photoUrl: string | null = null;
      if (photoFile) {
        try {
          const updated = await logisticsService.confirmDelivery(delivery.id, photoFile);
          photoUrl = updated.deliveryPhotoUrl ?? null;
        } catch {
          toast.error('La entrega fue confirmada, pero la foto de evidencia no pudo subirse.');
        }
      }

      onConfirmed(delivery.id, {
        status: 'DELIVERED',
        deliveryPhotoUrl: photoUrl ?? delivery.deliveryPhotoUrl,
        deliveredAt: result.deliveredAt,
      });
      toast.success(`Envío #${delivery.id} confirmado con PIN correctamente.`);
      setPin('');
      setPhotoFile(null);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al confirmar la entrega.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full border border-gray-100 shadow-2xl p-6 relative flex flex-col gap-4 animate-scale-up">
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-gray-900 text-lg">Confirmar Entrega</h3>
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
            Para mover el envío <strong>#{delivery.id}</strong> a <strong className="text-emerald-600">ENTREGADO</strong>,
            ingresa el PIN de 6 dígitos que el cliente recibió en su correo:
          </p>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-gray-400">PIN del cliente *</label>
            <div className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-2xl bg-white focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-600 transition-colors">
              <KeyRound className="w-4 h-4 text-emerald-500 shrink-0" />
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                autoFocus
                className="w-full text-base font-black tracking-[0.5em] text-gray-800 outline-none bg-transparent placeholder:text-gray-300"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-gray-400">Foto de evidencia (opcional)</label>
            <label className="flex items-center gap-2 px-4 py-3 border border-dashed border-gray-300 rounded-2xl bg-white cursor-pointer hover:border-emerald-500 transition-colors">
              <Camera className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-xs text-gray-500 font-semibold truncate">
                {photoFile ? photoFile.name : 'Seleccionar foto...'}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              />
            </label>
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
              disabled={pin.trim().length !== 6 || confirming}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:pointer-events-none rounded-xl shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/25 transition-all"
            >
              {confirming ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Confirmando...
                </>
              ) : (
                'Confirmar y Mover'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
