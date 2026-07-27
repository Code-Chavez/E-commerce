import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Package, Filter, Calendar, Loader2, ChevronDown, RefreshCw, Banknote } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminOrderService } from '../services/adminOrderService';
import type { AdminOrderFilters } from '../services/adminOrderService';
import type { Order, OrderStatus } from '@/features/ecommerce/types/order.types';
import { OrderStatusConfirmModal } from './OrderStatusConfirmModal';
import { ExportButton } from '@/shared/components/ExportButton';
import { ManageReturnModal } from './ManageReturnModal';
import { AlertCircle } from 'lucide-react';

export const AdminOrdersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const userIdParam = searchParams.get('userId');
  const emailParam = searchParams.get('email');

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AdminOrderFilters>(() => ({
    userId: userIdParam ? Number(userIdParam) : undefined,
  }));
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [returnModalOrder, setReturnModalOrder] = useState<Order | null>(null);

  const fetchOrders = async (currentFilters: AdminOrderFilters, append = false) => {
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      const response = await adminOrderService.getOrders(currentFilters);
      
      setOrders(prev => append ? [...prev, ...response.orders] : response.orders);
      setNextCursor(response.nextCursor);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchOrders(filters);
  }, [filters.status, filters.from, filters.to, filters.userId]);

  const handleFilterChange = (key: keyof AdminOrderFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined, cursor: undefined }));
  };

  const loadMore = () => {
    if (nextCursor) {
      const newFilters = { ...filters, cursor: nextCursor };
      fetchOrders(newFilters, true);
    }
  };

  const [processingRefundId, setProcessingRefundId] = useState<number | null>(null);

  const handleMarkRefundProcessed = async (order: Order) => {
    setProcessingRefundId(order.id);
    try {
      await adminOrderService.updateRefundStatus(order.id, 'PROCESSED');
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, refundStatus: 'PROCESSED' } : o));
      toast.success(`Reembolso del pedido #${order.id} marcado como procesado.`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al actualizar el estado del reembolso');
    } finally {
      setProcessingRefundId(null);
    }
  };

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return;
    try {
      await adminOrderService.updateOrderStatus(selectedOrder.id, newStatus);
      // Update local state
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: newStatus } : o));
    } catch (error) {
      console.error('Error updating status', error);
      alert('Error al actualizar el estado del pedido');
    }
  };

  const statusColors: Record<OrderStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PAID: 'bg-blue-100 text-blue-800',
    SHIPPED: 'bg-purple-100 text-purple-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    FAILED: 'bg-red-100 text-red-800',
    RETURNED: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Pedidos</h1>
          <p className="text-gray-500 text-sm mt-1">Administra todas las órdenes del E-commerce.</p>
        </div>
        
        <div className="flex gap-2">
          <ExportButton 
            type="sales" 
            defaultFrom={filters.from} 
            defaultTo={filters.to} 
          />
          <button 
            onClick={() => fetchOrders(filters)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Active User Filter Alert */}
      {(filters.userId || emailParam) && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl flex items-center justify-between text-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Filtrado por cliente:</span>
            <span>{emailParam || `ID de Usuario: ${filters.userId}`}</span>
          </div>
          <button
            onClick={() => {
              setSearchParams({});
              setFilters(prev => ({ ...prev, userId: undefined }));
            }}
            className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider cursor-pointer"
          >
            Limpiar Filtro
          </button>
        </div>
      )}

      {/* Filters and Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50/30 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Estado
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent transition-shadow text-sm"
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="PENDING">Pendiente</option>
                <option value="PAID">Pagado</option>
                <option value="SHIPPED">Enviado</option>
                <option value="DELIVERED">Entregado</option>
                <option value="CANCELLED">Cancelado</option>
                <option value="FAILED">Entrega Fallida</option>
                <option value="RETURNED">Devuelto</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Desde
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent transition-shadow text-sm"
                value={filters.from || ''}
                onChange={(e) => handleFilterChange('from', e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Hasta
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent transition-shadow text-sm"
                value={filters.to || ''}
                onChange={(e) => handleFilterChange('to', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
              <tr>
                <th className="px-6 py-4 font-medium">Pedido</th>
                <th className="px-6 py-4 font-medium">Fecha</th>
                <th className="px-6 py-4 font-medium">Cliente</th>
                <th className="px-6 py-4 font-medium">Total</th>
                <th className="px-6 py-4 font-medium">Estado</th>
                <th className="px-6 py-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && !loadingMore ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                    <p>Cargando pedidos...</p>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No se encontraron pedidos con los filtros actuales.</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <div>#{order.id}</div>
                      {order.returnRequests?.some(r => r.status === 'PENDING') && (
                        <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-800 uppercase tracking-wider">
                          <AlertCircle className="w-3 h-3" />
                          Devolución
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString('es-PE', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{order.user?.name || 'Cliente'}</div>
                      <div className="text-xs text-gray-500">{order.user?.email || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      S/ {order.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                        {order.status}
                      </span>
                      {order.refundStatus === 'PENDING' && (
                        <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
                          <Banknote className="w-3 h-3" />
                          Reembolso Pendiente
                        </div>
                      )}
                      {order.refundStatus === 'PROCESSED' && (
                        <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800 uppercase tracking-wider">
                          <Banknote className="w-3 h-3" />
                          Reembolsado
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {order.refundStatus === 'PENDING' ? (
                        <button
                          onClick={() => handleMarkRefundProcessed(order)}
                          disabled={processingRefundId === order.id}
                          className="text-sm font-bold text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                          {processingRefundId === order.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Banknote className="w-4 h-4" />}
                          Marcar Reembolsado
                        </button>
                      ) : order.returnRequests?.some(r => r.status === 'PENDING') ? (
                        <button
                          onClick={() => setReturnModalOrder(order)}
                          className="text-sm font-bold text-yellow-600 hover:text-yellow-700 transition-colors flex items-center gap-1"
                        >
                          <AlertCircle className="w-4 h-4" />
                          Gestionar Devolución
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-sm font-medium text-brand-accent hover:text-black transition-colors"
                        >
                          Actualizar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {nextCursor && (
          <div className="p-4 border-t border-gray-100 flex justify-center bg-gray-50/50">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:text-black transition-all font-medium text-sm shadow-sm disabled:opacity-50"
            >
              {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
              Cargar Más
            </button>
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderStatusConfirmModal
          isOpen={true}
          onClose={() => setSelectedOrder(null)}
          onConfirm={handleStatusChange}
          currentStatus={selectedOrder.status}
          orderId={selectedOrder.id}
        />
      )}

      {returnModalOrder && (
        <ManageReturnModal
          isOpen={true}
          onClose={() => setReturnModalOrder(null)}
          order={returnModalOrder}
          onReturnProcessed={() => fetchOrders(filters)}
        />
      )}
    </div>
  );
};
