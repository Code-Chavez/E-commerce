import React, { useEffect, useState } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';
import { UserPlus, Users, Search, Loader2, Mail } from 'lucide-react';
import type { Client } from './types/client';
import ConfirmModal from './components/ConfirmModal';

interface BulkReport {
  linked: number;
  skipped: number;
  errors: { id: number; error: string }[];
}

type PendingAction =
  | { type: 'single'; clientId: number }
  | { type: 'bulk' }
  | null;

export const ClientLinkPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkingId, setLinkingId] = useState<number | null>(null);
  const [bulkLinking, setBulkLinking] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    clientsNeedingEmail: { id: number; name: string }[];
  }>({
    isOpen: false,
    title: '',
    message: '',
    clientsNeedingEmail: [],
  });

  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [pendingEmails, setPendingEmails] = useState<Record<number, string>>({});

  useEffect(() => {
    fetchUnlinkedClients();
  }, []);

  const fetchUnlinkedClients = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/v1/admin/clients/unlinked');
      setClients(data.data);
    } catch (error: any) {
      toast.error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  const executeLink = async (clientId: number, email?: string) => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
    setLinkingId(clientId);
    try {
      await axiosInstance.post(`/v1/admin/clients/${clientId}/link`, email ? { email } : {});
      toast.success('Cliente vinculado exitosamente');
      fetchUnlinkedClients();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al vincular cliente');
    } finally {
      setLinkingId(null);
    }
  };

  const executeBulkLink = async (emails: Record<number, string>) => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
    setBulkLinking(true);
    try {
      const hasEmails = Object.keys(emails).length > 0;
      const { data } = await axiosInstance.post('/v1/admin/clients/bulk-link', {
        ids: selectedIds,
        ...(hasEmails ? { emails } : {}),
      });
      const report: BulkReport = data.data;

      toast.success(`Vinculación masiva completada: ${report.linked} vinculados, ${report.skipped} omitidos`);
      if (report.errors.length > 0) {
        toast.error(`${report.errors.length} errores encontrados`);
      }

      setSelectedIds([]);
      fetchUnlinkedClients();
    } catch (error: any) {
      toast.error('Error en el proceso masivo');
    } finally {
      setBulkLinking(false);
    }
  };

  const handleConfirm = () => {
    const missing = confirmModal.clientsNeedingEmail.filter(
      c => !pendingEmails[c.id]?.trim()
    );
    if (missing.length > 0) {
      toast.error('Ingresa el correo electrónico para todos los clientes indicados');
      return;
    }

    if (!pendingAction) return;

    if (pendingAction.type === 'single') {
      executeLink(pendingAction.clientId, pendingEmails[pendingAction.clientId]);
    } else {
      executeBulkLink(pendingEmails);
    }
  };

  const handleLink = (id: number) => {
    const client = clients.find(c => c.id === id);
    const clientName = client?.name || 'este cliente';
    const needsEmail = !client?.email;

    setPendingAction({ type: 'single', clientId: id });
    setPendingEmails(needsEmail ? { [id]: '' } : {});
    setConfirmModal({
      isOpen: true,
      title: 'Vincular Cliente',
      message: `¿Estás seguro de vincular a ${clientName} y enviar sus credenciales de acceso por correo electrónico?`,
      clientsNeedingEmail: needsEmail ? [{ id, name: clientName }] : [],
    });
  };

  const handleBulkLink = () => {
    if (selectedIds.length === 0) {
      toast.error('Selecciona al menos un cliente');
      return;
    }

    const clientsWithoutEmail = selectedIds
      .map(id => clients.find(c => c.id === id)!)
      .filter(c => !c.email)
      .map(c => ({ id: c.id, name: c.name }));

    setPendingAction({ type: 'bulk' });
    setPendingEmails(
      Object.fromEntries(clientsWithoutEmail.map(c => [c.id, '']))
    );
    setConfirmModal({
      isOpen: true,
      title: 'Vinculación Masiva',
      message: `¿Estás seguro de vincular a los ${selectedIds.length} clientes seleccionados y enviar sus credenciales de acceso?`,
      clientsNeedingEmail: clientsWithoutEmail,
    });
  };

  const toggleSelection = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === filteredClients.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredClients.map(c => c.id));
    }
  };

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.documentId?.includes(searchTerm)
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#3F3F3F]">Vinculación de Clientes POS</h1>
          <p className="text-[#3F3F3F]/60 mt-1">Gestiona la creación de cuentas e-commerce para clientes físicos.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleBulkLink}
            disabled={bulkLinking || selectedIds.length === 0}
            className="flex items-center gap-2 bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 text-[#F7F7F5] px-4 py-2 rounded-xl transition-all shadow-md font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
          >
            {bulkLinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
            {selectedIds.length === 0 ? "Selecciona clientes para vincular" : `Vincular Seleccionados (${selectedIds.length})`}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#D9D9D2] overflow-hidden">
        <div className="p-4 border-b border-[#D9D9D2]/40 bg-[#FAFAFA] flex items-center gap-3">
          <Search className="w-5 h-5 text-[#6B6B6B]" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o DNI..."
            className="bg-transparent border-none focus:ring-0 w-full text-[#3F3F3F] placeholder-[#6B6B6B]/60 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAFAFA] text-[#3F3F3F] uppercase text-xs font-bold tracking-wider border-b border-[#D9D9D2]/40">
                <th className="px-6 py-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredClients.length}
                    onChange={toggleAll}
                    className="rounded border-[#D9D9D2] text-[#3F3F3F] focus:ring-[#3F3F3F] w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Contacto</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9D9D2]/40">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#3F3F3F]" />
                    <p className="mt-2 text-[#6B6B6B]">Cargando clientes...</p>
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-[#6B6B6B]">
                    No se encontraron clientes sin cuenta activa.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(client.id)}
                        onChange={() => toggleSelection(client.id)}
                        className="rounded border-[#D9D9D2] text-[#3F3F3F] focus:ring-[#3F3F3F] w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#3F3F3F]">{client.name}</div>
                      <div className="text-xs font-semibold text-[#6B6B6B]">{client.documentId || 'Sin DNI'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold">
                      {client.email ? (
                        <div className="text-[#3F3F3F]">{client.email}</div>
                      ) : (
                        <div className="flex items-center gap-1 text-amber-600">
                          <Mail className="w-3.5 h-3.5" />
                          <span className="text-xs">Sin correo</span>
                        </div>
                      )}
                      <div className="text-[#6B6B6B]">{client.phone || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleLink(client.id)}
                        disabled={linkingId === client.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D9D9D2] hover:bg-[#FAFAFA] text-[#3F3F3F] font-bold rounded-lg transition-all text-xs disabled:opacity-50 shadow-sm cursor-pointer"
                      >
                        {linkingId === client.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <UserPlus className="w-4 h-4" />
                        )}
                        Vincular
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        isLoading={linkingId !== null || bulkLinking}
        onConfirm={handleConfirm}
        onCancel={() => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          setPendingAction(null);
          setPendingEmails({});
        }}
      >
        {confirmModal.clientsNeedingEmail.length > 0 && (
          <div className="mt-1 space-y-3">
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <Mail className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-700 font-medium">
                {confirmModal.clientsNeedingEmail.length === 1
                  ? 'Este cliente no tiene correo registrado. Ingresa uno para continuar:'
                  : `${confirmModal.clientsNeedingEmail.length} clientes no tienen correo registrado. Ingresa uno para cada uno:`}
              </p>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-3 pr-1">
              {confirmModal.clientsNeedingEmail.map((c, index) => (
                <div key={c.id}>
                  <label className="block text-xs font-semibold text-[#3F3F3F] mb-1">
                    {c.name}
                  </label>
                  <input
                    type="email"
                    autoFocus={index === 0}
                    autoComplete="off"
                    value={pendingEmails[c.id] ?? ''}
                    onChange={e =>
                      setPendingEmails(prev => ({ ...prev, [c.id]: e.target.value }))
                    }
                    onKeyDown={e => e.stopPropagation()}
                    placeholder="correo@ejemplo.com"
                    className="w-full border border-[#D9D9D2] rounded-lg px-3 py-2 text-sm text-[#3F3F3F] placeholder-[#6B6B6B]/60 focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]/20 focus:border-[#3F3F3F]/40"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </ConfirmModal>
    </div>
  );
};

export default ClientLinkPage;
