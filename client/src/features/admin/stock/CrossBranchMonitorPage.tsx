import React, { useEffect, useState } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';
import { 
  Building2, 
  Clock, 
  Package, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';

interface PendingItem {
  variantId: number;
  sku: string;
  productName: string;
  quantity: number;
  unitPrice: number | string;
}

interface PendingOrder {
  orderId: number;
  destinationBranchId: number;
  destinationBranchName: string;
  totalAmount: number | string;
  createdAt: string;
  items: PendingItem[];
}

interface GroupedPendingSales {
  sourceBranchId: number;
  sourceBranchName: string;
  pendingOrdersCount: number;
  totalReservedUnits: number;
  orders: PendingOrder[];
}

export const CrossBranchMonitorPage: React.FC = () => {
  useDocumentTitle('Ventas Intersucursal Pendientes - D\'Mendoza');

  const [groupedData, setGroupedData] = useState<GroupedPendingSales[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [expandedBranches, setExpandedBranches] = useState<Record<number, boolean>>({});

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axiosInstance.get('/v1/admin/cross-branch/pending');
      if (data.success) {
        const list: GroupedPendingSales[] = data.data || [];
        setGroupedData(list);
        
        // Auto-expand branches with pending sales
        const initialExpand: Record<number, boolean> = {};
        list.forEach(item => {
          if (item.pendingOrdersCount > 0) {
            initialExpand[item.sourceBranchId] = true;
          }
        });
        setExpandedBranches(prev => ({ ...initialExpand, ...prev }));
      } else {
        setError(data.error || 'Error al obtener la lista de monitoreo.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error de red al consultar ventas pendientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleBranch = (branchId: number) => {
    setExpandedBranches(prev => ({
      ...prev,
      [branchId]: !prev[branchId]
    }));
  };

  const handleConfirmDelivery = async (orderId: number) => {
    if (!window.confirm(`¿Confirmar la entrega física de la orden #${orderId}? Esta acción liberará/reducirá el stock de la sucursal de origen.`)) {
      return;
    }
    setConfirmingId(orderId);
    try {
      const { data } = await axiosInstance.patch(`/v1/pos/sales/${orderId}/confirm-cross-branch`);
      if (data.success) {
        toast.success(`Entrega de orden #${orderId} confirmada correctamente.`);
        fetchData();
      } else {
        toast.error(data.error || 'Error al confirmar la entrega.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Error al conectar con el servidor.');
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#D9D9D2]/40 pb-5">
        <div>
          <h1 className="text-2xl font-black text-[#3F3F3F]">Monitoreo de Ventas Cross-Branch</h1>
          <p className="text-xs text-[#6B6B6B] mt-1 font-semibold uppercase tracking-wider">
            Entrega física y reserva de stock entre sedes
          </p>
        </div>
        <button 
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#D9D9D2] hover:bg-[#FAFAFA] text-[#3F3F3F] text-sm font-bold rounded-xl transition-all shadow-sm disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {loading && groupedData.length === 0 ? (
        <div className="p-20 text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-[#3F3F3F] mb-4" />
          <span className="text-sm text-[#6B6B6B] font-semibold">Consultando ventas pendientes de entrega...</span>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
          <button onClick={fetchData} className="text-red-700 hover:text-red-900">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      ) : groupedData.length === 0 ? (
        <div className="p-16 text-center space-y-3 bg-white border border-[#D9D9D2]/40 rounded-2xl">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-[#3F3F3F]">¡Todo al día!</h3>
          <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto">
            No existen ventas Cross-Branch con entregas físicas pendientes en el sistema en este momento.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedData.map((branchGroup) => {
            const isExpanded = !!expandedBranches[branchGroup.sourceBranchId];
            return (
              <div 
                key={branchGroup.sourceBranchId}
                className="bg-white border border-[#D9D9D2]/50 rounded-2xl overflow-hidden shadow-sm transition-all"
              >
                {/* Branch Header */}
                <button
                  onClick={() => toggleBranch(branchGroup.sourceBranchId)}
                  className="w-full flex items-center justify-between p-4 bg-[#F7F7F5] border-b border-[#D9D9D2]/40 text-left hover:bg-[#F2F2F0] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-[#3F3F3F]">
                        Origen: {branchGroup.sourceBranchName}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider">
                        <span>{branchGroup.pendingOrdersCount} Pedidos Pendientes</span>
                        <span>•</span>
                        <span>{branchGroup.totalReservedUnits} Unidades Reservadas</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-[#6B6B6B]" /> : <ChevronDown className="w-5 h-5 text-[#6B6B6B]" />}
                  </div>
                </button>

                {/* Orders List */}
                {isExpanded && (
                  <div className="divide-y divide-[#D9D9D2]/30 p-4 bg-white space-y-4">
                    {branchGroup.orders.length === 0 ? (
                      <p className="text-xs text-gray-500 py-2">No hay órdenes para mostrar</p>
                    ) : (
                      branchGroup.orders.map((order) => (
                        <div key={order.orderId} className="pt-4 first:pt-0 flex flex-col md:flex-row md:items-start justify-between gap-6">
                          
                          {/* Order Meta & Destination */}
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-extrabold text-[#3F3F3F]">
                                Pedido #{order.orderId.toString().padStart(6, '0')}
                              </span>
                              <span className="text-[10px] bg-amber-50 border border-amber-200 text-amber-800 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                Pendiente Entrega
                              </span>
                              <span className="text-xs text-[#6B6B6B] flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(order.createdAt).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })}
                              </span>
                            </div>

                            <div className="p-2.5 bg-[#F7F7F5] rounded-xl border border-[#D9D9D2]/30 text-xs w-fit">
                              <span className="text-[#6B6B6B] font-semibold">Destino de Entrega: </span>
                              <span className="font-extrabold text-[#3F3F3F]">{order.destinationBranchName}</span>
                            </div>

                            {/* Items table inside order */}
                            <div className="border border-[#D9D9D2]/40 rounded-xl overflow-hidden mt-3 max-w-2xl">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-[#F7F7F5] border-b border-[#D9D9D2]/40 text-[#6B6B6B] font-bold">
                                  <tr>
                                    <th className="px-3 py-2">Producto</th>
                                    <th className="px-3 py-2">SKU</th>
                                    <th className="px-3 py-2 text-right">Cant.</th>
                                    <th className="px-3 py-2 text-right">Precio Unit.</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#D9D9D2]/20 text-[#3F3F3F]">
                                  {order.items.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-[#FAFAFA] transition-colors">
                                      <td className="px-3 py-2 font-medium flex items-center gap-1.5">
                                        <Package className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                        {item.productName}
                                      </td>
                                      <td className="px-3 py-2 font-mono text-gray-500">{item.sku}</td>
                                      <td className="px-3 py-2 text-right font-extrabold">{item.quantity}</td>
                                      <td className="px-3 py-2 text-right font-semibold">S/. {Number(item.unitPrice).toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Action & Total Column */}
                          <div className="text-right flex flex-col justify-between items-end gap-3 shrink-0 min-w-[150px]">
                            <div>
                              <span className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider block">Importe Total</span>
                              <span className="text-lg font-black text-[#3F3F3F]">S/. {Number(order.totalAmount).toFixed(2)}</span>
                            </div>

                            <button
                              onClick={() => handleConfirmDelivery(order.orderId)}
                              disabled={confirmingId === order.orderId}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {confirmingId === order.orderId && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                              Confirmar Entrega
                            </button>
                          </div>

                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CrossBranchMonitorPage;
