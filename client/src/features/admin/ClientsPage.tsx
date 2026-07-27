import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  Search, 
  Edit, 
  ShoppingBag, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Users, 
  ShieldAlert,
  ShieldCheck,
  UserX
} from 'lucide-react';
import { clientService } from './services/clientService';
import type { Client } from './types/client';
import ConfirmModal from './components/ConfirmModal';
import { EditClientModal } from './components/EditClientModal';
import { ExportButton } from '@/shared/components/ExportButton';

export const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState(''); // Only trigger fetch on submit/enter
  const [clientType, setClientType] = useState<'POS' | 'ECOMMERCE' | 'ALL'>('ALL');

  // Modals state
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  // Status confirm modal
  const [statusConfirm, setStatusConfirm] = useState<{
    isOpen: boolean;
    client: Client | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    client: null,
    isLoading: false,
  });

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await clientService.getClients({
        page,
        limit,
        type: clientType,
        search: searchQuery || undefined,
      });
      setClients(response.clients);
      setTotal(response.pagination.total);
      setTotalPages(response.pagination.totalPages || 1);
    } catch (error: any) {
      console.error(error);
      toast.error('Error al cargar la base de clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [page, clientType, searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchQuery(searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchQuery('');
    setPage(1);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setClientType(e.target.value as 'POS' | 'ECOMMERCE' | 'ALL');
    setPage(1);
  };

  // Status toggle handler
  const handleOpenStatusConfirm = (client: Client) => {
    if (!client.userId) return; // Safeguard
    setStatusConfirm({
      isOpen: true,
      client,
      isLoading: false,
    });
  };

  const handleConfirmStatusChange = async () => {
    const { client } = statusConfirm;
    if (!client || !client.userId) return;

    setStatusConfirm(prev => ({ ...prev, isLoading: true }));
    const newStatus = !client.isActive;

    try {
      await clientService.toggleUserStatus(client.userId, newStatus);
      toast.success(
        newStatus 
          ? `Cuenta de cliente activada para ${client.name}`
          : `Cuenta de cliente inactivada para ${client.name}`
      );
      
      // Update local state to avoid full reload if possible, then refresh
      setClients(prev =>
        prev.map(c => 
          c.id === client.id 
            ? { ...c, isActive: newStatus, type: newStatus ? c.type : 'POS' } 
            : c
        )
      );
      setStatusConfirm({ isOpen: false, client: null, isLoading: false });
      fetchClients();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || 'Error al actualizar el estado del cliente');
      setStatusConfirm(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleSaveClient = (updatedClient: Client) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    toast.success('Cliente actualizado correctamente');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#3F3F3F] flex items-center gap-2">
            <Users className="w-8 h-8 text-[#3F3F3F]" />
            Base Unificada de Clientes
          </h1>
          <p className="text-[#3F3F3F]/60 mt-1">
            Consulta y gestiona de forma unificada los clientes registrados desde el POS físico y la tienda E-commerce.
          </p>
        </div>
        <div>
          <ExportButton type="clients" />
        </div>
      </div>

      {/* Filters Area */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#D9D9D2] flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 flex items-center gap-3">
            <Search className="w-5 h-5 text-[#6B6B6B]" />
            <input
              type="text"
              placeholder="Buscar por nombre, apellidos o DNI/RUC..."
              className="bg-transparent border-none focus:ring-0 w-full text-[#3F3F3F] outline-none text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors uppercase cursor-pointer"
              >
                Limpiar
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 text-[#F7F7F5] font-bold rounded-xl transition-all shadow-md text-sm cursor-pointer"
          >
            Buscar
          </button>
        </form>

        <div className="w-full md:w-64">
          <select
            value={clientType}
            onChange={handleTypeChange}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/20 text-[#3F3F3F] text-sm h-full cursor-pointer"
          >
            <option value="ALL">Todos los clientes</option>
            <option value="POS">Solo Registro POS</option>
            <option value="ECOMMERCE">Solo E-commerce Activo</option>
          </select>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#D9D9D2] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAFAFA] text-[#3F3F3F] uppercase text-xs font-bold tracking-wider border-b border-[#D9D9D2]/40">
                <th className="px-6 py-4">Cliente / Contacto</th>
                <th className="px-6 py-4">Documento</th>
                <th className="px-6 py-4">Tipo de Cliente</th>
                <th className="px-6 py-4">Estado Cuenta</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9D9D2]/40 text-[#3F3F3F]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#3F3F3F]" />
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#6B6B6B] text-sm">
                    No se encontraron clientes registrados.
                  </td>
                </tr>
              ) : (
                clients.map((client) => {
                  const hasUser = !!client.userId;
                  return (
                    <tr key={client.id} className="hover:bg-[#FAFAFA]/50 transition-colors">
                      {/* Name & Contact */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-[#3F3F3F]">
                          {client.name} {client.lastName || ''}
                        </div>
                        <div className="text-xs text-[#6B6B6B] font-semibold mt-0.5 space-y-0.5">
                          {client.email && <div>{client.email}</div>}
                          {client.phone && <div>Tel: {client.phone}</div>}
                        </div>
                      </td>

                      {/* Document info */}
                      <td className="px-6 py-4">
                        {client.documentId ? (
                          <>
                            <div className="font-bold text-sm text-[#3F3F3F]">
                              {client.documentId}
                            </div>
                            <div className="text-[10px] text-[#6B6B6B] font-bold uppercase tracking-wider mt-0.5">
                              {client.documentType || 'DNI'}
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No registrado</span>
                        )}
                      </td>

                      {/* Type Badge */}
                      <td className="px-6 py-4">
                        {client.type === 'POS' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200/50">
                            POS
                          </span>
                        )}
                        {client.type === 'ECOMMERCE' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                            E-commerce
                          </span>
                        )}
                        {client.type === 'AMBOS' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/40">
                            Ambos (Físico/Web)
                          </span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-4">
                        {client.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
                            Inactivo
                          </span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit button */}
                          <button
                            onClick={() => setEditingClient(client)}
                            className="p-2 text-[#6B6B6B] hover:text-[#3F3F3F] hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                            title="Editar cliente"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Inactivate Toggle */}
                          {hasUser ? (
                            <button
                              onClick={() => handleOpenStatusConfirm(client)}
                              className={`p-2 rounded-xl transition-all cursor-pointer ${
                                client.isActive 
                                  ? 'text-rose-600 hover:text-rose-800 hover:bg-rose-50' 
                                  : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'
                              }`}
                              title={client.isActive ? 'Desactivar cuenta del cliente' : 'Activar cuenta del cliente'}
                            >
                              {client.isActive ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                            </button>
                          ) : (
                            <button
                              disabled
                              className="p-2 text-gray-300 rounded-xl cursor-not-allowed"
                              title="Clientes POS no tienen cuenta de usuario que activar/inactivar"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          )}

                          {/* Orders link */}
                          {hasUser ? (
                            <Link
                              to={`/admin/orders?userId=${client.userId}&email=${encodeURIComponent(client.email || '')}`}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-all"
                              title="Ver historial de pedidos"
                            >
                              <ShoppingBag className="w-4 h-4" />
                            </Link>
                          ) : (
                            <button
                              disabled
                              className="p-2 text-gray-300 rounded-xl cursor-not-allowed"
                              title="Clientes únicamente POS no registran pedidos e-commerce"
                            >
                              <ShoppingBag className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-[#D9D9D2]/30 bg-[#F7F7F5]">
            <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
              Total: {total} Clientes
            </span>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="p-1.5 bg-white border border-[#D9D9D2] hover:bg-[#FAFAFA] text-[#3F3F3F] rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-[#3F3F3F] px-2">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="p-1.5 bg-white border border-[#D9D9D2] hover:bg-[#FAFAFA] text-[#3F3F3F] rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Client Modal */}
      <EditClientModal
        isOpen={!!editingClient}
        client={editingClient}
        onClose={() => setEditingClient(null)}
        onSave={handleSaveClient}
      />

      {/* Status Confirm Modal */}
      <ConfirmModal
        isOpen={statusConfirm.isOpen}
        title={statusConfirm.client?.isActive ? 'Desactivar Cuenta de Cliente' : 'Activar Cuenta de Cliente'}
        message={
          statusConfirm.client?.isActive 
            ? `¿Estás seguro de que deseas desactivar la cuenta del cliente ${statusConfirm.client?.name}? El usuario ya no podrá iniciar sesión en la tienda web ni realizar pedidos hasta que se vuelva a activar.`
            : `¿Estás seguro de que deseas activar la cuenta del cliente ${statusConfirm.client?.name}? El usuario volverá a tener acceso completo para comprar en el e-commerce.`
        }
        confirmText={statusConfirm.client?.isActive ? 'Inactivar' : 'Activar'}
        cancelText="Volver"
        isLoading={statusConfirm.isLoading}
        onConfirm={handleConfirmStatusChange}
        onCancel={() => setStatusConfirm({ isOpen: false, client: null, isLoading: false })}
      />
    </div>
  );
};

export default ClientsPage;
