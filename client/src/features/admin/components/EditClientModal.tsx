import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { Client } from '../types/client';
import { clientService } from '../services/clientService';
import { ClientCommunicationsTab } from './ClientCommunicationsTab';

interface EditClientModalProps {
  isOpen: boolean;
  client: Client | null;
  onClose: () => void;
  onSave: (updatedClient: Client) => void;
}

export const EditClientModal: React.FC<EditClientModalProps> = ({
  isOpen,
  client,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(client?.name || '');
  const [lastName, setLastName] = useState(client?.lastName || '');
  const [email, setEmail] = useState(client?.email || '');
  const [phone, setPhone] = useState(client?.phone || '');
  const [documentType, setDocumentType] = useState(client?.documentType || 'DNI');
  const [documentId, setDocumentId] = useState(client?.documentId || '');
  const [address, setAddress] = useState(client?.address || '');
  const [department, setDepartment] = useState(client?.department || '');
  const [province, setProvince] = useState(client?.province || '');
  const [district, setDistrict] = useState(client?.district || '');
  const [ubigeo, setUbigeo] = useState(client?.ubigeo || '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'communications'>('info');

  React.useEffect(() => {
    if (client) {
      setName(client.name || '');
      setLastName(client.lastName || '');
      setEmail(client.email || '');
      setPhone(client.phone || '');
      setDocumentType(client.documentType || 'DNI');
      setDocumentId(client.documentId || '');
      setAddress(client.address || '');
      setDepartment(client.department || '');
      setProvince(client.province || '');
      setDistrict(client.district || '');
      setUbigeo(client.ubigeo || '');
      setActiveTab('info');
      setError(null);
    }
  }, [client]);

  if (!isOpen || !client) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre o razón social es requerido');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await clientService.updateClient(client.id, {
        name,
        lastName: lastName || null,
        email: email || null,
        phone: phone || null,
        documentType: documentType || null,
        documentId: documentId || null,
        address: address || null,
        department: department || null,
        province: province || null,
        district: district || null,
        ubigeo: ubigeo || null,
      });
      onSave({
        ...client,
        ...updated,
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      const errors = err.response?.data?.error;
      if (Array.isArray(errors) && errors.length > 0) {
        setError(errors[0].message);
      } else {
        setError(err.response?.data?.error || 'Error al actualizar el cliente');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-[#D9D9D2]/40"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#D9D9D2]/40 flex justify-between items-center bg-[#FAFAFA]">
          <h2 className="text-xl font-bold text-[#3F3F3F]">Ficha del Cliente</h2>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-6 border-b border-[#D9D9D2]/40 flex gap-4 bg-[#FAFAFA]">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'info' ? 'border-[#3F3F3F] text-[#3F3F3F]' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Información General
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('communications')}
            className={`py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'communications' ? 'border-[#3F3F3F] text-[#3F3F3F]' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Comunicaciones
          </button>
        </div>

        {activeTab === 'info' ? (
          /* Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Nombres / Razón Social *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/20 text-[#3F3F3F]"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Apellidos
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/20 text-[#3F3F3F]"
                />
              </div>

              {/* Document Type */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Tipo de Documento
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/20 text-[#3F3F3F]"
                >
                  <option value="DNI">DNI</option>
                  <option value="RUC">RUC</option>
                </select>
              </div>

              {/* Document ID */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Número de Documento
                </label>
                <input
                  type="text"
                  value={documentId}
                  onChange={(e) => setDocumentId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/20 text-[#3F3F3F]"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/20 text-[#3F3F3F]"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/20 text-[#3F3F3F]"
                />
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/20 text-[#3F3F3F]"
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Departamento
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/20 text-[#3F3F3F]"
                />
              </div>

              {/* Province */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Provincia
                </label>
                <input
                  type="text"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/20 text-[#3F3F3F]"
                />
              </div>

              {/* District */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Distrito
                </label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/20 text-[#3F3F3F]"
                />
              </div>

              {/* Ubigeo */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Ubigeo
                </label>
                <input
                  type="text"
                  value={ubigeo}
                  onChange={(e) => setUbigeo(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/20 text-[#3F3F3F]"
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-4 flex justify-end gap-3 border-t border-[#D9D9D2]/40 bg-[#FAFAFA] -mx-6 -mb-6 p-4">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 border border-[#D9D9D2] hover:bg-gray-50 text-[#3F3F3F] font-bold rounded-xl transition-all duration-200 text-sm disabled:opacity-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 text-[#F7F7F5] font-bold rounded-xl transition-all duration-200 text-sm flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Guardar Cambios
              </button>
            </div>
          </form>
        ) : (
          /* Communications Tab placeholder */
          <div className="p-6 space-y-4 min-h-[400px] flex flex-col justify-between">
            <div className="flex-grow flex flex-col">
              <ClientCommunicationsTab clientId={client.id} />
            </div>
            
            {/* Footer Actions */}
            <div className="pt-4 flex justify-end border-t border-[#D9D9D2]/40 bg-[#FAFAFA] -mx-6 -mb-6 p-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[#D9D9D2] hover:bg-gray-50 text-[#3F3F3F] font-bold rounded-xl transition-all duration-200 text-sm cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
