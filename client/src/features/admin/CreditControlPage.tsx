import React, { useState, useEffect } from 'react';
import { Landmark, Search, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';
import { clientService } from './services/clientService';
import { creditService } from './services/creditService';
import type { Client } from './types/client';
import type { Credit } from './types/credit.types';
import { CreditTable } from './components/credits/CreditTable';
import { PaymentFormModal } from './components/credits/PaymentFormModal';
import { toast } from 'react-hot-toast';

export const CreditControlPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [searchingClients, setSearchingClients] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [credits, setCredits] = useState<Credit[]>([]);
  const [totalPending, setTotalPending] = useState<number>(0);
  const [loadingCredits, setLoadingCredits] = useState(false);

  // Modal State
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    credit: Credit | null;
  }>({
    isOpen: false,
    credit: null,
  });

  const handleSearchClients = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error('Por favor ingresa un término de búsqueda');
      return;
    }

    setSearchingClients(true);
    try {
      const response = await clientService.getClients({
        page: 1,
        limit: 10,
        type: 'ALL',
        search: searchQuery,
      });
      setClients(response.clients);
      if (response.clients.length === 0) {
        toast.error('No se encontraron clientes');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al buscar clientes');
    } finally {
      setSearchingClients(false);
    }
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setClients([]);
    setSearchQuery('');
  };

  const fetchCredits = async () => {
    if (!selectedClient) return;
    setLoadingCredits(true);
    try {
      const data = await creditService.getCreditsByClient(selectedClient.id);
      setCredits(data.credits);
      setTotalPending(data.totalPendingBalance);
    } catch (err: any) {
      console.error(err);
      toast.error('Error al cargar créditos del cliente');
    } finally {
      setLoadingCredits(false);
    }
  };

  useEffect(() => {
    if (selectedClient) {
      fetchCredits();
    } else {
      setCredits([]);
      setTotalPending(0);
    }
  }, [selectedClient]);

  const handlePayClick = (credit: Credit) => {
    setPaymentModal({
      isOpen: true,
      credit,
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#3F3F3F] flex items-center gap-2">
          <Landmark className="w-8 h-8 text-[#3F3F3F]" />
          Control de Cuentas por Cobrar y Créditos
        </h1>
        <p className="text-[#3F3F3F]/60 mt-1">
          Gestiona los créditos activos de los clientes y registra los pagos parciales o abonos.
        </p>
      </div>

      {/* Selector de Cliente */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#D9D9D2] space-y-4">
        <h2 className="text-lg font-bold text-[#3F3F3F]">Seleccionar Cliente</h2>
        
        <form onSubmit={handleSearchClients} className="flex gap-2 max-w-2xl">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 flex items-center gap-3">
            <Search className="w-5 h-5 text-[#6B6B6B]" />
            <input
              type="text"
              placeholder="Buscar cliente por nombre, DNI o RUC..."
              className="bg-transparent border-none focus:ring-0 w-full text-[#3F3F3F] outline-none text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={searchingClients}
            className="px-4 py-2 bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 text-[#F7F7F5] font-bold rounded-xl transition-all shadow-md text-sm cursor-pointer disabled:opacity-50"
          >
            {searchingClients ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        {/* Resultados de Clientes */}
        {clients.length > 0 && (
          <div className="mt-2 border border-[#D9D9D2]/60 rounded-xl divide-y divide-[#D9D9D2]/30 max-h-60 overflow-y-auto bg-gray-50">
            {clients.map((client) => (
              <div
                key={client.id}
                onClick={() => handleSelectClient(client)}
                className="p-3 hover:bg-white transition-colors cursor-pointer flex justify-between items-center"
              >
                <div>
                  <div className="font-bold text-[#3F3F3F] text-sm">
                    {client.name} {client.lastName || ''}
                  </div>
                  <div className="text-xs text-[#6B6B6B]">
                    {client.documentType || 'DNI'}: {client.documentId || 'No registrado'} | {client.email}
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                  Seleccionar
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Cliente Seleccionado */}
        {selectedClient && (
          <div className="mt-4 p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                Cliente Seleccionado
              </span>
              <h3 className="text-lg font-bold text-[#3F3F3F] mt-1.5">
                {selectedClient.name} {selectedClient.lastName || ''}
              </h3>
              <p className="text-xs text-[#6B6B6B]">
                {selectedClient.documentType || 'DNI'}: {selectedClient.documentId || 'N/A'} | Email: {selectedClient.email}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedClient(null)}
                className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200/50 rounded-xl transition-all cursor-pointer bg-white"
              >
                Cambiar Cliente
              </button>
              <button
                onClick={fetchCredits}
                className="p-2 text-gray-500 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all cursor-pointer bg-white"
                title="Recargar créditos"
              >
                <RefreshCw className={`w-4 h-4 ${loadingCredits ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detalles del Crédito del Cliente Seleccionado */}
      {selectedClient && (
        <div className="bg-white rounded-2xl shadow-sm border border-[#D9D9D2] overflow-hidden">
          {/* Dashboard Resumen */}
          <div className="p-6 border-b border-[#D9D9D2]/40 bg-[#FAFAFA] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#3F3F3F]">Créditos Activos</h2>
              <p className="text-xs text-[#6B6B6B] mt-0.5">Listado de cuentas pendientes y montos asignados.</p>
            </div>
            
            <div className="bg-white px-5 py-3 rounded-2xl border border-[#D9D9D2]/50 flex items-center gap-3">
              <div className={`p-2 rounded-xl ${totalPending > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {totalPending > 0 ? <ShieldAlert className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
              </div>
              <div>
                <div className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider">Saldo Total Pendiente</div>
                <div className={`text-xl font-black ${totalPending > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {`$${totalPending.toFixed(2)}`}
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de Créditos */}
          <CreditTable
            credits={credits}
            loading={loadingCredits}
            onPayClick={handlePayClick}
          />
        </div>
      )}

      {/* Payment Form Modal */}
      {paymentModal.isOpen && paymentModal.credit && (
        <PaymentFormModal
          isOpen={paymentModal.isOpen}
          creditId={paymentModal.credit.id}
          pendingBalance={paymentModal.credit.pendingBalance}
          onClose={() => setPaymentModal({ isOpen: false, credit: null })}
          onSuccess={fetchCredits}
        />
      )}
    </div>
  );
};

export default CreditControlPage;
