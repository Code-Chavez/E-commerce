import React, { useEffect, useState, useMemo } from 'react';
import { Landmark, Plus, Search, HelpCircle, Sparkles, Building2 } from 'lucide-react';
import { useCashRegisters } from './hooks/useCashRegisters';
import type { CashRegister } from './hooks/useCashRegisters';
import { useBranches } from './hooks/useBranches';
import { CashRegistersTable } from './components/CashRegistersTable';
import { CashRegisterModal } from './components/CashRegisterModal';
import type { CashRegisterFormData } from './schemas/cashRegister.schema';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { ConfirmModal } from '@/features/admin/components/ConfirmModal';

export const CashRegistersPage: React.FC = () => {
  useDocumentTitle('Gestión de Cajas Registradoras');

  const {
    registers,
    loading: registersLoading,
    submitting,
    fetchRegisters,
    createRegister,
    updateRegister,
    deleteRegister,
  } = useCashRegisters();

  const {
    branches,
    loading: branchesLoading,
    fetchBranches,
  } = useBranches();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRegister, setEditingRegister] = useState<CashRegister | null>(null);

  // Confirm Modal state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [registerToDelete, setRegisterToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  useEffect(() => {
    // Fetch all registers in system initially
    fetchRegisters();
  }, [fetchRegisters]);

  // Combine registers with branch details for better list representations
  const registersWithBranches = useMemo(() => {
    return registers.map((reg) => {
      const branchDetails = branches.find((b) => b.id === reg.branchId);
      return {
        ...reg,
        branch: branchDetails ? { id: branchDetails.id, name: branchDetails.name } : undefined,
      };
    });
  }, [registers, branches]);

  // Filter & search implementation
  const filteredRegisters = useMemo(() => {
    return registersWithBranches.filter((reg) => {
      const matchesSearch = reg.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBranch = selectedBranchFilter === 'all' || reg.branchId === parseInt(selectedBranchFilter, 10);
      return matchesSearch && matchesBranch;
    });
  }, [registersWithBranches, searchTerm, selectedBranchFilter]);

  // Stats computation
  const stats = useMemo(() => {
    const total = registers.length;
    const branchesCount = branches.filter((b) => b.isActive).length;
    return { total, branchesCount };
  }, [registers, branches]);

  const handleOpenCreateModal = () => {
    setEditingRegister(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (reg: CashRegister) => {
    setEditingRegister(reg);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (data: CashRegisterFormData) => {
    let success = null;
    if (editingRegister) {
      success = await updateRegister(editingRegister.id, { name: data.name });
    } else {
      success = await createRegister(data);
    }

    if (success) {
      setIsModalOpen(false);
      setEditingRegister(null);
    }
  };

  const handleDeleteTrigger = (id: number) => {
    setRegisterToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (registerToDelete === null) return;
    setDeleting(true);
    try {
      const success = await deleteRegister(registerToDelete);
      if (success) {
        setIsConfirmOpen(false);
        setRegisterToDelete(null);
      }
    } finally {
      setDeleting(false);
    }
  };

  const activeBranches = useMemo(() => {
    return branches.filter((b) => b.isActive);
  }, [branches]);

  const loading = registersLoading || branchesLoading;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#D9D9D2]/40 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#3F3F3F]/80 uppercase tracking-widest mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Infraestructura POS y Finanzas</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#3F3F3F] tracking-tight">
            Gestión de Cajas Registradoras
          </h1>
          <p className="text-sm text-[#6B6B6B] mt-1 max-w-2xl">
            Registra y administra las cajas físicas asignadas a cada sede comercial. Esto permite habilitar y supervisar de forma independiente los turnos y la facturación de cada vendedor.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          disabled={activeBranches.length === 0}
          className="flex items-center gap-2 bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow hover:scale-[1.01] self-start md:self-auto cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Nueva Caja Registradora
        </button>
      </div>

      {/* KPI Visual Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        
        {/* Total Cash Registers */}
        <div className="bg-white p-5 rounded-2xl border border-[#D9D9D2]/50 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-200">
          <div className="p-3 bg-[#F7F7F5] text-[#3F3F3F] rounded-xl border border-[#D9D9D2]/30">
            <Landmark className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Cajas Registradoras Totales</p>
            <h3 className="text-2xl font-bold text-[#3F3F3F] mt-0.5">{stats.total}</h3>
          </div>
        </div>

        {/* Operational Branches */}
        <div className="bg-white p-5 rounded-2xl border border-[#D9D9D2]/50 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-200">
          <div className="p-3 bg-[#F7F7F5] text-[#3F3F3F] rounded-xl border border-[#D9D9D2]/30">
            <Building2 className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Sucursales Activas Vinculables</p>
            <h3 className="text-2xl font-bold text-[#3F3F3F] mt-0.5">{stats.branchesCount}</h3>
          </div>
        </div>

      </div>

      {/* Main Content Section */}
      <div className="space-y-4">
        
        {/* Search Bar / Filter Panel */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          
          {/* Search Box */}
          <div className="flex-1 flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-[#D9D9D2]/50 shadow-sm focus-within:ring-1 focus-within:ring-[#3F3F3F] focus-within:border-[#3F3F3F]">
            <Search className="w-5 h-5 text-[#6B6B6B]/60" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar caja por nombre..."
              className="w-full bg-transparent border-none outline-none text-sm text-[#3F3F3F] placeholder-[#6B6B6B]/40"
            />
          </div>

          {/* Branch Filter Selector */}
          <div className="w-full sm:w-64">
            <select
              value={selectedBranchFilter}
              onChange={(e) => setSelectedBranchFilter(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#D9D9D2]/70 bg-white text-sm text-[#3F3F3F] focus:outline-none focus:ring-1 focus:ring-[#3F3F3F] focus:border-[#3F3F3F] font-medium shadow-sm"
            >
              <option value="all">Todas las sucursales</option>
              {activeBranches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Table Component */}
        <CashRegistersTable
          registers={filteredRegisters}
          loading={loading}
          onEdit={handleOpenEditModal}
          onDelete={handleDeleteTrigger}
        />

      </div>

      {/* Administrative Guidelines */}
      <div className="p-4 bg-[#F7F7F5]/80 rounded-xl border border-[#D9D9D2]/30 flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-[#6B6B6B] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-[#6B6B6B] space-y-1">
          <span className="font-semibold text-[#3F3F3F]">Nota Administrativa de Seguridad:</span>
          <p>
            Las cajas registradoras no pueden ser desactivadas o eliminadas si tienen un turno de caja activo o abierto en este preciso momento. Si se requiere dar de baja una caja, asegúrese primero de realizar el arqueo de caja y cierre de turno de la sesión en el POS.
          </p>
        </div>
      </div>

      {/* Interactive Creation/Modification Modal */}
      <CashRegisterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        editingRegister={editingRegister}
        submitting={submitting}
        branches={activeBranches}
      />

      {/* Confirm Deactivation Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Desactivar Caja Registradora"
        message="¿Está seguro de que desea desactivar/eliminar esta caja registradora? Esta acción evitará que los vendedores inicien turnos en ella."
        confirmText="Desactivar Caja"
        cancelText="Cancelar"
        isLoading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsConfirmOpen(false);
          setRegisterToDelete(null);
        }}
      />

    </div>
  );
};

export default CashRegistersPage;
