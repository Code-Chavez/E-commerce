import React, { useState } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import type { Order } from '@/features/ecommerce/types/order.types';
import { adminReturnService } from '../services/adminReturnService';

interface ManageReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onReturnProcessed: () => void;
}

export const ManageReturnModal: React.FC<ManageReturnModalProps> = ({
  isOpen,
  onClose,
  order,
  onReturnProcessed,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const returnRequest = order.returnRequests?.find(r => r.status === 'PENDING');
  
  if (!returnRequest) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl w-full max-w-md p-6 relative">
          <p className="text-gray-600">No hay solicitud de devolución pendiente para esta orden.</p>
          <div className="mt-6 flex justify-end">
            <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-lg font-medium text-gray-700">Cerrar</button>
          </div>
        </div>
      </div>
    );
  }

  const handleApprove = async () => {
    setLoading(true);
    setError(null);
    try {
      // Approve and then issue credit note in one go
      await adminReturnService.approveReturn(returnRequest.id);
      await adminReturnService.issueCreditNote(returnRequest.id);
      onReturnProcessed();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al procesar la devolución');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    setError(null);
    try {
      await adminReturnService.rejectReturn(returnRequest.id);
      onReturnProcessed();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al rechazar la devolución');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={!loading ? onClose : undefined} />
      
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            Gestionar Devolución
          </h2>
          <button 
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Pedido</p>
              <p className="text-base font-semibold text-gray-900">#{order.id}</p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
              <p className="text-sm font-medium text-yellow-800 mb-1">Motivo de la Devolución</p>
              <p className="text-sm text-yellow-900 leading-relaxed whitespace-pre-wrap">
                {returnRequest.reason || 'Sin especificar'}
              </p>
            </div>

            <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p>Total del pedido original: <span className="font-semibold text-gray-900">S/ {order.total.toFixed(2)}</span></p>
              <p className="mt-1 text-xs text-gray-500">Al aprobar, se generará y enviará un vale (Nota de Crédito) al cliente automáticamente.</p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3 justify-end">
          <button
            onClick={handleReject}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 font-medium transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            Rechazar
          </button>
          <button
            onClick={handleApprove}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium transition-colors disabled:opacity-50 shadow-sm shadow-green-600/20"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Aprobar y Emitir Vale
          </button>
        </div>
      </div>
    </div>
  );
};
