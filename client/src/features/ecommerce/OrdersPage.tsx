import React from 'react';
import { useOrders } from './hooks/useOrders';
import { OrderCard } from './components/OrderCard';
import { Loader2, ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';

export const OrdersPage: React.FC = () => {
  useDocumentTitle('Mis Pedidos - E-Commerce');
  const {
    orders,
    isLoading,
    error,
    page,
    totalPages,
    statusFilter,
    setPage,
    setStatusFilter,
    reloadOrders,
  } = useOrders(5); // Paginación de 5 en 5 pedidos por tarjeta

  const filterTabs = [
    { label: 'Todos', key: 'ALL' },
    { label: 'Pendientes', key: 'PENDING' },
    { label: 'Pagados', key: 'PAID' },
    { label: 'Enviados', key: 'SHIPPED' },
    { label: 'Entregados', key: 'DELIVERED' },
    { label: 'Cancelados', key: 'CANCELLED' },
    { label: 'Fallidos', key: 'FAILED' },
    { label: 'Devueltos', key: 'RETURNED' },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white rounded-2xl p-6 border border-brand-primary/30 shadow-sm">
        <h2 className="text-xl font-extrabold text-brand-accent tracking-tight flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-brand-accent" />
          Historial de Pedidos
        </h2>
        <p className="text-xs text-brand-text mt-1">
          Revisa el estado de tus compras y descarga el comprobante digital en formato PDF.
        </p>
      </div>

      {/* Tabs Filter Bar */}
      <div className="bg-white p-2 rounded-2xl border border-brand-primary/30 shadow-sm overflow-x-auto whitespace-nowrap scrollbar-none">
        <div className="flex gap-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                statusFilter === tab.key
                  ? 'bg-brand-accent text-white shadow-sm'
                  : 'text-brand-text hover:bg-brand-primary/10 hover:text-brand-accent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20 bg-white rounded-3xl border border-brand-primary/30 shadow-sm">
          <Loader2 className="w-10 h-10 animate-spin text-brand-accent" />
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-3xl text-center text-red-800 text-sm font-semibold shadow-sm">
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-brand-primary/30 flex flex-col items-center gap-4">
          <ClipboardList className="h-16 w-16 text-gray-200" />
          <div>
            <h3 className="text-base font-bold text-[#3F3F3F]">Sin pedidos registrados</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
              No encontramos ningún pedido en esta categoría. Si acabas de realizar una compra, puede tardar unos segundos en procesarse.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Order Cards List */}
          <div className="space-y-6">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} onOrderUpdated={reloadOrders} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-white rounded-2xl p-4 border border-brand-primary/30 shadow-sm flex items-center justify-between">
              <span className="text-xs font-bold text-brand-text">
                Página {page} de {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 border border-gray-200 hover:border-black rounded-xl text-gray-500 hover:text-black bg-white transition disabled:opacity-40 disabled:hover:border-gray-200"
                  title="Página Anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="p-2 border border-gray-200 hover:border-black rounded-xl text-gray-500 hover:text-black bg-white transition disabled:opacity-40 disabled:hover:border-gray-200"
                  title="Página Siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default OrdersPage;
