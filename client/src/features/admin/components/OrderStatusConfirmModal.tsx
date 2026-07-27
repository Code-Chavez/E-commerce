import React, { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import type { OrderStatus } from '@/features/ecommerce/types/order.types';

interface OrderStatusConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (status: OrderStatus) => Promise<void>;
  currentStatus: OrderStatus;
  orderId: number;
}

const statusOptions: { value: OrderStatus; label: string; color: string }[] = [
  { value: 'PENDING', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'PAID', label: 'Pagado', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'SHIPPED', label: 'Enviado', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'DELIVERED', label: 'Entregado', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'CANCELLED', label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-200' },
];

export const OrderStatusConfirmModal: React.FC<OrderStatusConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentStatus,
  orderId,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(currentStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      await onConfirm(selectedStatus);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Cambiar Estado de Pedido</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-start gap-3 p-4 bg-amber-50 text-amber-800 rounded-xl">
            <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
            <p className="text-sm">
              Estás a punto de cambiar el estado del pedido <strong>#{orderId}</strong>. 
              El cliente podrá ver este cambio en su perfil.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nuevo Estado
            </label>
            <div className="grid grid-cols-1 gap-2">
              {statusOptions.map((status) => (
                <button
                  key={status.value}
                  type="button"
                  onClick={() => setSelectedStatus(status.value)}
                  className={`
                    flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition-all
                    ${
                      selectedStatus === status.value
                        ? `border-brand-accent bg-brand-accent/5`
                        : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <span>{status.label}</span>
                  <span className={`px-2 py-1 rounded-full text-xs border ${status.color}`}>
                    {status.value}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedStatus === currentStatus || isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-brand-accent hover:bg-black rounded-xl transition-all disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirmar Cambio
          </button>
        </div>
      </div>
    </div>
  );
};
