import React, { useEffect, useState, useMemo } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Pencil, 
  XCircle, 
  Loader2, 
  Search, 
  Users,
  CheckCircle2
} from 'lucide-react';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import type { Gender } from './types/gender';

const GendersPage: React.FC = () => {
  useDocumentTitle('Gestión de Público Objetivo / Géneros');

  const [genders, setGenders] = useState<Gender[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Gender | null>(null);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchGenders = async () => {
    try {
      const { data } = await axiosInstance.get('/v1/genders');
      setGenders(data.data);
    } catch { 
      toast.error('Error al cargar géneros'); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchGenders(); 
  }, []);

  const filteredGenders = useMemo(() => {
    return genders.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [genders, searchTerm]);

  const stats = useMemo(() => {
    const total = genders.length;
    const active = genders.filter(g => g.isActive).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [genders]);

  const openCreate = () => { 
    setEditing(null); 
    setName(''); 
    setShowModal(true); 
  };
  
  const openEdit = (g: Gender) => { 
    setEditing(g); 
    setName(g.name); 
    setShowModal(true); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { name: name.trim() };
      if (editing) {
        await axiosInstance.put(`/v1/genders/${editing.id}`, payload);
        toast.success('Género actualizado');
      } else {
        await axiosInstance.post('/v1/genders', payload);
        toast.success('Género creado');
      }
      setShowModal(false);
      fetchGenders();
    } catch { 
      toast.error('Error al guardar'); 
    } finally { 
      setSubmitting(false); 
    }
  };

  const handleToggleActive = async (g: Gender) => {
    try {
      if (g.isActive) {
        await axiosInstance.delete(`/v1/genders/${g.id}`);
        toast.success('Género desactivado');
      } else {
        await axiosInstance.put(`/v1/genders/${g.id}`, { isActive: true });
        toast.success('Género activado');
      }
      fetchGenders();
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto min-h-screen bg-[#F7F7F5] text-[#3F3F3F]">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Público Objetivo (Géneros)</h1>
          <p className="text-slate-500 mt-1">
            Administra los públicos objetivos o géneros asignados a los productos del e-commerce.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 text-[#F7F7F5] px-6 py-2.5 rounded-xl font-medium shadow-md transition-all scale-100 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          Añadir Género
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-[#D9D9D2] p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Géneros</p>
            <h3 className="text-2xl font-black text-slate-800">{stats.total}</h3>
          </div>
        </div>

        <div className="bg-white border border-[#D9D9D2] p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Activos</p>
            <h3 className="text-2xl font-black text-slate-800">{stats.active}</h3>
          </div>
        </div>

        <div className="bg-white border border-[#D9D9D2] p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inactivos</p>
            <h3 className="text-2xl font-black text-slate-800">{stats.inactive}</h3>
          </div>
        </div>
      </div>

      {/* Búsqueda y Tabla */}
      <div className="bg-white border border-[#D9D9D2] rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#D9D9D2]/60">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar público u género..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#D9D9D2] rounded-xl outline-none focus:border-[#3F3F3F] text-sm transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#3F3F3F]" />
            <p className="text-slate-400 text-sm font-medium">Cargando géneros...</p>
          </div>
        ) : filteredGenders.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            No se encontraron públicos objetivos o géneros.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-600">
              <thead className="bg-[#D9D9D2]/20 text-[#3F3F3F] font-semibold text-xs border-b border-[#D9D9D2]">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Nombre / Público</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9D9D2]/40">
                {filteredGenders.map(g => (
                  <tr key={g.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs">{g.id}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">{g.name}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        g.isActive 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {g.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-3">
                      <button
                        onClick={() => openEdit(g)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
                        title="Editar Género"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(g)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          g.isActive 
                            ? 'hover:bg-rose-50 text-slate-400 hover:text-rose-600' 
                            : 'hover:bg-emerald-50 text-slate-400 hover:text-emerald-600'
                        }`}
                        title={g.isActive ? 'Desactivar' : 'Activar'}
                      >
                        {g.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#F7F7F5] rounded-2xl border border-[#D9D9D2] shadow-2xl max-w-md w-full overflow-hidden animate-scaleUp">
            <div className="border-b border-[#D9D9D2] p-5 flex justify-between items-center bg-[#D9D9D2]/20">
              <h2 className="text-xl font-bold text-[#3F3F3F]">
                {editing ? 'Editar Público Objetivo' : 'Añadir Público Objetivo'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#3F3F3F]">
                  Nombre del Público / Género <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Hombre, Mujer, Unisex, Infantil"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[#D9D9D2] bg-white rounded-xl outline-none focus:border-[#3F3F3F] transition-all text-sm"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#D9D9D2]/40">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border border-[#D9D9D2] hover:bg-[#D9D9D2]/20 text-[#3F3F3F] rounded-xl font-medium transition-all text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 disabled:opacity-50 text-[#F7F7F5] px-6 py-2.5 rounded-xl font-semibold transition-all shadow text-sm"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? 'Guardar Cambios' : 'Añadir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GendersPage;
