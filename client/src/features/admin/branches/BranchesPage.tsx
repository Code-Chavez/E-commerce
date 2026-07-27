import React, { useEffect, useState, useMemo } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  MapPin, 
  Warehouse as WarehouseIcon,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { useBranches } from './hooks/useBranches';
import type { Branch } from './hooks/useBranches';
import { BranchesTable } from './components/BranchesTable';
import { BranchModal } from './components/BranchModal';
import type { BranchFormData } from './schemas/branch.schema';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';

export const BranchesPage: React.FC = () => {
  useDocumentTitle('Sucursales y Almacenes');

  const {
    branches,
    loading,
    submitting,
    fetchBranches,
    createBranch,
    updateBranch,
    toggleBranchStatus,
  } = useBranches();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  // Client-side filtering for immediate feedback
  const filteredBranches = useMemo(() => {
    return branches.filter((branch) => {
      const nameMatch = branch.name.toLowerCase().includes(searchTerm.toLowerCase());
      const addressMatch = (branch.address || '').toLowerCase().includes(searchTerm.toLowerCase());
      const phoneMatch = (branch.phone || '').toLowerCase().includes(searchTerm.toLowerCase());
      return nameMatch || addressMatch || phoneMatch;
    });
  }, [branches, searchTerm]);

  // Visual Stats (KPI Cards)
  const stats = useMemo(() => {
    const total = branches.length;
    const active = branches.filter((b) => b.isActive).length;
    const withAddress = branches.filter((b) => b.address).length;
    return { total, active, withAddress };
  }, [branches]);

  const handleOpenCreateModal = () => {
    setEditingBranch(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (branch: Branch) => {
    setEditingBranch(branch);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (data: BranchFormData) => {
    let success = null;
    if (editingBranch) {
      success = await updateBranch(editingBranch.id, data);
    } else {
      success = await createBranch(data);
    }

    if (success) {
      setIsModalOpen(false);
      setEditingBranch(null);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    await toggleBranchStatus(id, !currentStatus);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#D9D9D2]/40 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#3F3F3F]/80 uppercase tracking-widest mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Configuración de Infraestructura</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#3F3F3F] tracking-tight">
            Sucursales y Almacenes
          </h1>
          <p className="text-sm text-[#6B6B6B] mt-1 max-w-2xl">
            Administra las sedes comerciales de la empresa. Al crear una sucursal, el sistema autogenera atómicamente un almacén independiente vinculado para salvaguardar el inventario físico y lógico.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow hover:scale-[1.01] self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nueva Sucursal
        </button>
      </div>

      {/* KPI Visual Dashboard / Clean Organizers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        
        {/* Total Branches */}
        <div className="bg-white p-5 rounded-2xl border border-[#D9D9D2]/50 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-200">
          <div className="p-3 bg-[#F7F7F5] text-[#3F3F3F] rounded-xl border border-[#D9D9D2]/30">
            <Building2 className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Sucursales Comerciales</p>
            <h3 className="text-2xl font-bold text-[#3F3F3F] mt-0.5">{stats.total}</h3>
          </div>
        </div>

        {/* Operating Warehouses */}
        <div className="bg-white p-5 rounded-2xl border border-[#D9D9D2]/50 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-200">
          <div className="p-3 bg-[#F7F7F5] text-[#3F3F3F] rounded-xl border border-[#D9D9D2]/30">
            <WarehouseIcon className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Almacenes Operativos</p>
            <h3 className="text-2xl font-bold text-[#3F3F3F] mt-0.5">{stats.active}</h3>
          </div>
        </div>

        {/* Geographic Coverage */}
        <div className="bg-white p-5 rounded-2xl border border-[#D9D9D2]/50 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-200">
          <div className="p-3 bg-[#F7F7F5] text-[#3F3F3F] rounded-xl border border-[#D9D9D2]/30">
            <MapPin className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Sedes Geocodificadas</p>
            <h3 className="text-2xl font-bold text-[#3F3F3F] mt-0.5">{stats.withAddress}</h3>
          </div>
        </div>

      </div>

      {/* Main Table Section */}
      <div className="space-y-4">
        
        {/* Search Bar / Filtering */}
        <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-[#D9D9D2]/50 max-w-md shadow-sm focus-within:ring-1 focus-within:ring-[#3F3F3F] focus-within:border-[#3F3F3F]">
          <Search className="w-5 h-5 text-[#6B6B6B]/60" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar sucursal por nombre, dirección o teléfono..."
            className="w-full bg-transparent border-none outline-none text-sm text-[#3F3F3F] placeholder-[#6B6B6B]/40"
          />
        </div>

        {/* Branches Table Component */}
        <BranchesTable
          branches={filteredBranches}
          loading={loading}
          onEdit={handleOpenEditModal}
          onToggleStatus={handleToggleStatus}
        />

      </div>

      {/* Help and guidelines card at the bottom */}
      <div className="p-4 bg-[#F7F7F5]/80 rounded-xl border border-[#D9D9D2]/30 flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-[#6B6B6B] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-[#6B6B6B] space-y-1">
          <span className="font-semibold text-[#3F3F3F]">Nota Administrativa:</span>
          <p>
            Los almacenes independientes no se pueden eliminar por separado. Están vinculados con integridad referencial restrictiva en cascada a nivel de base de datos. Si una sucursal se desactiva, su almacén también se considerará suspendido para recepciones de inventario.
          </p>
        </div>
      </div>

      {/* Interactive Geocoding Modal */}
      <BranchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        editingBranch={editingBranch}
        submitting={submitting}
      />

    </div>
  );
};

export default BranchesPage;
