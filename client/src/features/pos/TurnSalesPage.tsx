import React, { useEffect, useState } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import { usePos } from '@/features/pos/context/PosContext';
import { Receipt, type ReceiptData } from './components/Receipt';
import { Printer, RefreshCw, AlertTriangle, Clock, CreditCard, Banknote, Landmark, Smartphone, XCircle } from 'lucide-react';
import { useAuth } from '@/shared/context/AuthContext';
import { AdminAuthModal } from './components/AdminAuthModal';

interface SaleListItem {
  id: number;
  status: string;
  total: string | number;
  subtotal: string | number;
  createdAt: string;
  isCrossBranch?: boolean;
  sourceBranchId?: number;
  sourceBranch?: {
    id: number;
    name: string;
  };
  payments: {
    method: string;
    amount: string | number;
  }[];
}

export const TurnSalesPage: React.FC = () => {
  const { user } = useAuth();
  const { turnId, isOpen } = usePos();
  const [sales, setSales] = useState<SaleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // States para impresión
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

  // States para anulación
  const [cancellingSaleId, setCancellingSaleId] = useState<number | null>(null);
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [saleToCancel, setSaleToCancel] = useState<number | null>(null);

  // State para confirmar entrega cross-branch
  const [confirmingSaleId, setConfirmingSaleId] = useState<number | null>(null);

  const fetchSales = async () => {
    if (!turnId) return;
    try {
      setLoading(true);
      setError(null);
      const { data } = await axiosInstance.get(`/v1/pos/turns/${turnId}/sales`);
      if (data.success) {
        setSales(data.data);
      }
    } catch (error) {
      const err = error as any;
      setError(err.response?.data?.error || 'Error al obtener las ventas del turno.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && turnId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchSales();
    }
  }, [isOpen, turnId]);

  // Ejecuta la impresión una vez se cargó la data
  useEffect(() => {
    if (receiptData) {
      setTimeout(() => {
        window.print();
        setTimeout(() => {
          setReceiptData(null);
          setSelectedSaleId(null);
        }, 500);
      }, 100); // Pequeño delay para asegurar que el DOM actualizó el recibo
    }
  }, [receiptData]);

  const onReprint = async (saleId: number) => {
    try {
      setLoadingReceipt(true);
      setSelectedSaleId(saleId);
      const { data } = await axiosInstance.get(`/v1/pos/sales/${saleId}/receipt`);
      if (data.success) {
        setReceiptData(data.data);
      }
    } catch (error) {
      const err = error as any;
      console.error(err);
      setSelectedSaleId(null);
      alert('Error al obtener los datos del comprobante');
    } finally {
      setLoadingReceipt(false);
    }
  };

  const handleCancelClick = (saleId: number) => {
    const isAdmin = user?.role === 'ADMIN';
    if (isAdmin) {
      if (window.confirm('¿Está seguro de que desea anular esta venta? Esta acción no se puede deshacer.')) {
        void executeCancel(saleId);
      }
    } else {
      setSaleToCancel(saleId);
      setIsAdminAuthModalOpen(true);
    }
  };

  const executeCancel = async (saleId: number, adminEmail?: string, adminPassword?: string) => {
    try {
      setCancellingSaleId(saleId);
      const { data } = await axiosInstance.patch(`/v1/pos/sales/${saleId}/cancel`, {
        adminEmail,
        adminPassword
      });
      if (data.success) {
        alert('Venta anulada correctamente');
        setIsAdminAuthModalOpen(false);
        setSaleToCancel(null);
        void fetchSales();
      }
    } catch (error) {
      const err = error as any;
      alert(err.response?.data?.error || 'Error al anular la venta');
    } finally {
      setCancellingSaleId(null);
    }
  };

  const handleConfirmCrossBranch = async (saleId: number) => {
    if (!window.confirm('¿Confirmar la entrega física de esta venta Cross-Branch?')) return;
    try {
      setConfirmingSaleId(saleId);
      const { data } = await axiosInstance.patch(`/v1/pos/sales/${saleId}/confirm-cross-branch`);
      if (data.success) {
        alert('Entrega física confirmada con éxito. Stock actualizado en origen.');
        void fetchSales();
      }
    } catch (error) {
      const err = error as any;
      alert(err.response?.data?.error || 'Error al confirmar la entrega.');
    } finally {
      setConfirmingSaleId(null);
    }
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'CASH': return <Banknote className="w-3.5 h-3.5 text-green-600" />;
      case 'CARD': return <CreditCard className="w-3.5 h-3.5 text-blue-600" />;
      case 'TRANSFER': return <Landmark className="w-3.5 h-3.5 text-indigo-600" />;
      case 'YAPE': return <Smartphone className="w-3.5 h-3.5 text-purple-600" />;
      default: return <Banknote className="w-3.5 h-3.5" />;
    }
  };

  if (!isOpen) {
    return (
      <div className="p-6">
        <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <p className="text-sm font-semibold">Debes abrir un turno de caja para ver tus ventas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      
      {/* Ocultamos el recibo real, solo lo usamos para imprimir */}
      <div className="hidden print:block">
        {receiptData && <Receipt data={receiptData} />}
      </div>

      <div className="print:hidden space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[#3F3F3F]">Ventas de tu Turno</h1>
            <p className="text-sm text-[#6B6B6B] mt-1 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Turno actual ID: {turnId}
            </p>
          </div>
          <button 
            onClick={fetchSales}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#D9D9D2] hover:bg-[#FAFAFA] text-[#3F3F3F] text-sm font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
            <button onClick={fetchSales} className="text-red-700 hover:text-red-900"><RefreshCw className="w-4 h-4" /></button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-[#D9D9D2]/40 overflow-hidden">
            {loading && sales.length === 0 ? (
              <div className="p-12 text-center text-[#6B6B6B]">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">Cargando ventas...</p>
              </div>
            ) : sales.length === 0 ? (
              <div className="p-12 text-center text-[#6B6B6B]">
                <div className="w-16 h-16 bg-[#FAFAFA] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#D9D9D2]/30">
                  <Banknote className="w-8 h-8 opacity-50" />
                </div>
                <p className="text-base font-bold text-[#3F3F3F]">No hay ventas en este turno</p>
                <p className="text-sm mt-1">Las ventas que realices aparecerán aquí.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#FAFAFA] text-[#6B6B6B] border-b border-[#D9D9D2]/40">
                    <tr>
                      <th className="px-6 py-4 font-bold">N° Pedido</th>
                      <th className="px-6 py-4 font-bold">Fecha y Hora</th>
                      <th className="px-6 py-4 font-bold">Métodos de Pago</th>
                      <th className="px-6 py-4 font-bold text-right">Total</th>
                      <th className="px-6 py-4 font-bold text-center">Estado</th>
                      <th className="px-6 py-4 font-bold text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D9D9D2]/20">
                    {sales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-[#FAFAFA]/50 transition-colors group">
                        <td className="px-6 py-4 font-bold text-[#3F3F3F] flex flex-col gap-1">
                          <span>#{sale.id.toString().padStart(6, '0')}</span>
                          {sale.isCrossBranch && (
                            <span className="inline-flex items-center gap-1 w-fit text-[9px] bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                              Cross-Branch: {sale.sourceBranch?.name || `Sede #${sale.sourceBranchId}`}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-[#6B6B6B]">
                          {new Date(sale.createdAt).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {sale.payments.map((p, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-[#D9D9D2]/50 rounded-md text-xs font-semibold text-[#3F3F3F]">
                                {getPaymentIcon(p.method)}
                                S/ {Number(p.amount).toFixed(2)}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-black text-[#3F3F3F] text-right">
                          S/ {Number(sale.total).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            sale.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 
                            sale.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {sale.status === 'COMPLETED' ? 'Completada' : sale.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {sale.isCrossBranch && sale.status !== 'COMPLETED' && sale.status !== 'CANCELLED' && (
                              <button
                                onClick={() => handleConfirmCrossBranch(sale.id)}
                                disabled={confirmingSaleId === sale.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {confirmingSaleId === sale.id ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : null}
                                Confirmar Entrega
                              </button>
                            )}
                            <button
                              onClick={() => handleCancelClick(sale.id)}
                              disabled={cancellingSaleId === sale.id || sale.status !== 'COMPLETED'}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 text-xs font-bold rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {(cancellingSaleId === sale.id) ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5" />
                              )}
                              Anular
                            </button>
                            <button
                              onClick={() => onReprint(sale.id)}
                              disabled={loadingReceipt || sale.status !== 'COMPLETED'}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#3F3F3F] hover:bg-black text-white text-xs font-bold rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {(loadingReceipt && selectedSaleId === sale.id) ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Printer className="w-3.5 h-3.5" />
                              )}
                              Reimprimir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => {
          setIsAdminAuthModalOpen(false);
          setSaleToCancel(null);
        }}
        onConfirm={(email, password) => {
          if (saleToCancel) {
            void executeCancel(saleToCancel, email, password);
          }
        }}
        isLoading={cancellingSaleId !== null}
      />
    </div>
  );
};

export default TurnSalesPage;
