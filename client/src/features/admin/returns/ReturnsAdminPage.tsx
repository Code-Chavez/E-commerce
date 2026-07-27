import React, { useEffect, useState } from 'react';
import { adminReturnService } from '../services/adminReturnService';
import { Loader2, XCircle, Package } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { toast } from 'react-hot-toast';

export const ReturnsAdminPage: React.FC = () => {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Modal State
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    id: number | null;
    action: 'approve' | 'reject' | null;
  }>({ isOpen: false, id: null, action: null });

  const fetchReturns = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminReturnService.listReturns();
      setReturns(data);
    } catch (err: any) {
      console.error(err);
      setError('Error al cargar las solicitudes de devolución.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleApprove = async (id: number) => {
    setProcessingId(id);
    try {
      const result = await adminReturnService.approveReturn(id);
      toast.success(
        `Devolución #${id} aprobada — Orden de Recojo #${result.pickupOrderId} generada`
      );
      await adminReturnService.issueCreditNote(id);
      await fetchReturns();
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.error || 'Error al aprobar la devolución';
      setError(msg);
      toast.error(msg);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: number) => {
    setProcessingId(id);
    try {
      await adminReturnService.rejectReturn(id);
      toast.success(`Devolución #${id} rechazada correctamente`);
      await fetchReturns();
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.error || 'Error al rechazar la devolución';
      setError(msg);
      toast.error(msg);
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmAction = () => {
    if (!confirmState.id || !confirmState.action) return;
    
    if (confirmState.action === 'approve') {
      handleApprove(confirmState.id);
    } else {
      handleReject(confirmState.id);
    }
    setConfirmState({ isOpen: false, id: null, action: null });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRefundTypeLabel = (type: string) => {
    return type === 'STORE_CREDIT' ? 'Saldo a Favor' : 'Nota de Crédito (Banco)';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        <p className="text-gray-500 mt-2 font-medium animate-pulse">Cargando devoluciones...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-xl flex flex-col items-center justify-center min-h-[400px]">
        <XCircle className="w-12 h-12 mb-2 opacity-50" />
        <p className="font-medium text-lg">{error}</p>
        <button onClick={fetchReturns} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Solicitudes de Devolución</h1>
          <p className="text-gray-500 text-sm mt-1">Gestiona los reembolsos y vales solicitados por los clientes.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {returns.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <Package className="w-12 h-12 mb-3 text-gray-300" />
            <p className="font-medium text-gray-600">No hay solicitudes de devolución.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-600 uppercase tracking-wider text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Cliente / Pedido</th>
                  <th className="px-6 py-4">Motivo</th>
                  <th className="px-6 py-4">Reembolso Solicitado</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {returns.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-gray-900">#{req.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{req.user?.name || 'Cliente'}</div>
                      <div className="text-xs text-gray-500">{req.user?.email}</div>
                      <div className="text-xs font-mono text-gray-400 mt-1 border border-gray-200 bg-gray-50 rounded px-1.5 py-0.5 inline-block">
                        Pedido #{req.orderId}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-sm text-gray-700 line-clamp-2" title={req.reason}>
                        {req.reason || 'Sin motivo'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {req.rawItems?.length || 0} artículo(s)
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-brand-primary">{getRefundTypeLabel(req.refundType)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(req.status)}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {req.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => setConfirmState({ isOpen: true, id: req.id, action: 'reject' })}
                            disabled={processingId === req.id}
                            className="inline-flex items-center justify-center px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors disabled:opacity-50 text-xs cursor-pointer"
                          >
                            {processingId === req.id && confirmState.action === 'reject' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Rechazar'}
                          </button>
                          <button
                            onClick={() => setConfirmState({ isOpen: true, id: req.id, action: 'approve' })}
                            disabled={processingId === req.id}
                            className="inline-flex items-center justify-center px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 text-xs cursor-pointer"
                          >
                            {processingId === req.id && confirmState.action === 'approve' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Aprobar'}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.action === 'approve' ? 'Aprobar Devolución' : 'Rechazar Devolución'}
        message={
          confirmState.action === 'approve'
            ? '¿Estás seguro de aprobar esta devolución? Se generará automáticamente una Orden de Recojo para retirar los productos y se emitirá el vale correspondiente (Nota de Crédito o Saldo a Favor) al cliente.'
            : '¿Estás seguro de rechazar esta devolución? Esta acción no se puede deshacer.'
        }
        confirmText={confirmState.action === 'approve' ? 'Sí, Aprobar' : 'Sí, Rechazar'}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmState({ isOpen: false, id: null, action: null })}
      />
    </div>
  );
};
