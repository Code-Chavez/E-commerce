import React, { useEffect, useState, useMemo } from 'react';
import { Sparkles, Plus, Search, UserCheck, Users, ShieldAlert, Loader2 } from 'lucide-react';
import { useSuppliers } from './hooks/useSuppliers';
import type { Supplier } from './hooks/useSuppliers';
import { SuppliersTable } from './components/SuppliersTable';
import { SupplierModal } from './components/SupplierModal';
import type { SupplierFormData } from './schemas/supplier.schema';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';

export const SuppliersPage: React.FC = () => {
  useDocumentTitle('Gestión de Proveedores');

  const {
    suppliers,
    loading,
    submitting,
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    toggleSupplierStatus,
  } = useSuppliers();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // Client-side filtering for search responsiveness
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => {
      const rucMatch = supplier.ruc.includes(searchTerm);
      const nameMatch = supplier.razonSocial.toLowerCase().includes(searchTerm.toLowerCase());
      const contactMatch = supplier.contacto.toLowerCase().includes(searchTerm.toLowerCase());
      return rucMatch || nameMatch || contactMatch;
    });
  }, [suppliers, searchTerm]);

  // Stats computation
  const stats = useMemo(() => {
    const total = suppliers.length;
    const active = suppliers.filter((s) => s.isActive).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [suppliers]);

  const handleOpenCreateModal = () => {
    setEditingSupplier(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (data: SupplierFormData) => {
    let success = null;
    if (editingSupplier) {
      success = await updateSupplier(editingSupplier.id, data);
    } else {
      success = await createSupplier(data);
    }

    if (success) {
      setIsModalOpen(false);
      setEditingSupplier(null);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    await toggleSupplierStatus(id, !currentStatus);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#D9D9D2]/40 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#3F3F3F]/80 uppercase tracking-widest mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Módulo de Inventario</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#3F3F3F] tracking-tight">
            Gestión de Proveedores
          </h1>
          <p className="text-sm text-[#6B6B6B] mt-1 max-w-2xl">
            Administra el catálogo de proveedores y socios comerciales. Controla su información fiscal y estado para habilitar ingresos en el almacén.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 bg-[#3F3F3F] text-white px-5 py-3 rounded-xl hover:bg-[#1e1e1a] transition-all text-sm font-semibold shadow-lg shadow-black/10 self-start md:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Proveedor</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* KPI 1 */}
        <div className="bg-white rounded-2xl border border-[#D9D9D2]/30 p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#3F3F3F]/5 text-[#3F3F3F]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">Total Proveedores</span>
            <span className="text-2xl font-extrabold text-[#3F3F3F] mt-0.5 block">{stats.total}</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white rounded-2xl border border-[#D9D9D2]/30 p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">Proveedores Activos</span>
            <span className="text-2xl font-extrabold text-[#3F3F3F] mt-0.5 block">{stats.active}</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white rounded-2xl border border-[#D9D9D2]/30 p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">Proveedores Inactivos</span>
            <span className="text-2xl font-extrabold text-[#3F3F3F] mt-0.5 block">{stats.inactive}</span>
          </div>
        </div>

      </div>

      {/* Search and Table Container */}
      <div className="space-y-4">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B6B6B]/80">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Buscar por razón social, RUC o contacto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D9D9D2]/70 bg-white text-sm text-[#3F3F3F] placeholder-[#6B6B6B]/50 focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]/20 focus:border-[#3F3F3F] transition-all"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#3F3F3F] animate-spin" />
            <p className="text-sm text-[#6B6B6B] mt-2">Cargando catálogo de proveedores...</p>
          </div>
        ) : (
          <SuppliersTable
            suppliers={filteredSuppliers}
            onEdit={handleOpenEditModal}
            onToggleStatus={handleToggleStatus}
          />
        )}
      </div>

      {/* Form Modal */}
      <SupplierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        editingSupplier={editingSupplier}
        submitting={submitting}
      />

    </div>
  );
};

export default SuppliersPage;
