import React, { useEffect, useRef, useState, useMemo } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Pencil, 
  XCircle, 
  Loader2, 
  Upload, 
  ImageOff, 
  Search, 
  Award, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';

interface Brand { id: number; name: string; logoUrl: string | null; isActive: boolean; }
interface FormState { name: string; logoUrl: string; }

const BrandsPage: React.FC = () => {
  useDocumentTitle('Gestión de Marcas');

  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [form, setForm] = useState<FormState>({ name: '', logoUrl: '' });
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchBrands = async () => {
    try {
      const { data } = await axiosInstance.get('/v1/brands');
      setBrands(data.data);
    } catch { 
      toast.error('Error al cargar marcas'); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchBrands(); 
  }, []);

  // Client-side search filtering
  const filteredBrands = useMemo(() => {
    return brands.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [brands, searchTerm]);

  // Visual KPIs Stats
  const stats = useMemo(() => {
    const total = brands.length;
    const active = brands.filter(b => b.isActive).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [brands]);

  const openCreate = () => { setEditing(null); setForm({ name: '', logoUrl: '' }); setPreview(null); setSelectedFile(null); setShowModal(true); };
  const openEdit = (b: Brand) => { setEditing(b); setForm({ name: b.name, logoUrl: b.logoUrl ?? '' }); setPreview(b.logoUrl); setSelectedFile(null); setShowModal(true); };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) { toast.error('Solo JPEG, PNG o WEBP'); return; }
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let finalLogoUrl = form.logoUrl;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('image', selectedFile);
        const { data } = await axiosInstance.post('/v1/brands/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        finalLogoUrl = data.data.url;
      }
      const payload = { name: form.name, logoUrl: finalLogoUrl || null };
      if (editing) {
        await axiosInstance.patch(`/v1/brands/${editing.id}`, payload);
        toast.success('Marca actualizada');
      } else {
        await axiosInstance.post('/v1/brands', payload);
        toast.success('Marca creada');
      }
      setShowModal(false);
      fetchBrands();
    } catch { 
      toast.error('Error al guardar'); 
    } finally { 
      setSubmitting(false); 
    }
  };

  const handleDeactivate = async (id: number) => {
    if (!confirm('¿Inactivar esta marca?')) return;
    try {
      await axiosInstance.delete(`/v1/brands/${id}`);
      toast.success('Marca inactivada');
      fetchBrands();
    } catch { 
      toast.error('Error al inactivar'); 
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#D9D9D2]/40 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#3F3F3F]/80 uppercase tracking-widest mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Módulo de Configuración</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#3F3F3F] tracking-tight">
            Marcas Comerciales
          </h1>
          <p className="text-sm text-[#6B6B6B] mt-1 max-w-2xl">
            Gestiona los sellos y marcas comerciales vinculados al catálogo de prendas y productos de D'Mendoza.
          </p>
        </div>

        <button 
          onClick={openCreate} 
          className="flex items-center gap-2 bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 text-white font-bold px-5 py-2.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow hover:scale-[1.01] self-start md:self-auto cursor-pointer text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Marca</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-[#D9D9D2]/50 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-200">
          <div className="p-3 bg-[#F7F7F5] text-[#3F3F3F] rounded-xl border border-[#D9D9D2]/30">
            <Award className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Total Registradas</p>
            <h3 className="text-2xl font-bold text-[#3F3F3F] mt-0.5">{stats.total}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D9D9D2]/50 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-200">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <CheckCircle2 className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Marcas Activas</p>
            <h3 className="text-2xl font-bold text-[#3F3F3F] mt-0.5">{stats.active}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D9D9D2]/50 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-200">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100">
            <XCircle className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Suspendidas</p>
            <h3 className="text-2xl font-bold text-[#3F3F3F] mt-0.5">{stats.inactive}</h3>
          </div>
        </div>
      </div>

      {/* Filter and Content panel */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-[#D9D9D2]/50 max-w-md shadow-sm focus-within:ring-1 focus-within:ring-[#3F3F3F] focus-within:border-[#3F3F3F]">
          <Search className="w-5 h-5 text-[#6B6B6B]/60" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar marca por nombre..."
            className="w-full bg-transparent border-none outline-none text-sm text-[#3F3F3F] placeholder-[#6B6B6B]/40"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#3F3F3F] animate-spin" />
            <p className="text-sm text-[#6B6B6B] mt-2">Cargando catálogo de marcas...</p>
          </div>
        ) : (
          <div className="bg-white border border-[#D9D9D2]/30 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-[#FAFAFA] border-b border-[#D9D9D2]/30">
                <tr>
                  <th className="px-6 py-4 text-left font-bold text-[#3F3F3F] uppercase tracking-wider text-xs">Logo</th>
                  <th className="px-6 py-4 text-left font-bold text-[#3F3F3F] uppercase tracking-wider text-xs">Nombre</th>
                  <th className="px-6 py-4 text-left font-bold text-[#3F3F3F] uppercase tracking-wider text-xs">Estado</th>
                  <th className="px-6 py-4 text-right font-bold text-[#3F3F3F] uppercase tracking-wider text-xs">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9D9D2]/20">
                {filteredBrands.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-[#6B6B6B] text-xs">
                      No se encontraron marcas registradas con el término buscado.
                    </td>
                  </tr>
                ) : (
                  filteredBrands.map(b => (
                    <tr key={b.id} className="hover:bg-[#FAFAFA]/50 transition-colors">
                      <td className="px-6 py-4">
                        {b.logoUrl ? (
                          <img src={b.logoUrl} alt={b.name} className="w-12 h-12 object-contain rounded-xl border border-[#D9D9D2]/40 bg-[#FAFAFA] p-1" />
                        ) : (
                          <div className="w-12 h-12 flex items-center justify-center bg-[#FAFAFA] rounded-xl border border-[#D9D9D2]/40 text-gray-300">
                            <ImageOff size={20} />
                          </div>
                        )}
                      </td>
                      <td className={`px-6 py-4 font-bold text-sm text-[#3F3F3F] ${!b.isActive ? 'text-gray-400 line-through' : ''}`}>
                        {b.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full ${
                          b.isActive 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' 
                            : 'bg-red-50 text-red-700 border border-red-200/50'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${b.isActive ? 'bg-emerald-600 animate-pulse' : 'bg-red-600'}`} />
                          {b.isActive ? 'Activa' : 'Suspendida'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-3">
                          <button 
                            onClick={() => openEdit(b)} 
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#3F3F3F] hover:bg-[#FAFAFA] transition-colors"
                            title="Editar Marca"
                          >
                            <Pencil size={16} />
                          </button>
                          {b.isActive && (
                            <button 
                              onClick={() => handleDeactivate(b.id)} 
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Inactivar Marca"
                            >
                              <XCircle size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Creation/Edition Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-[#1e1e1a]/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setShowModal(false)}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-[#D9D9D2]/30 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-bold text-[#3F3F3F] border-b border-[#D9D9D2]/40 pb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#6B6B6B]" />
              <span>{editing ? 'Editar Marca Comercial' : 'Nueva Marca Comercial'}</span>
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#3F3F3F] uppercase tracking-wider mb-2">
                  Nombre de Marca *
                </label>
                <input
                  className="w-full px-4 py-2.5 rounded-xl border border-[#D9D9D2]/70 bg-[#FAFAFA] text-sm text-[#3F3F3F] placeholder-[#6B6B6B]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]/20 focus:border-[#3F3F3F] transition-all"
                  value={form.name}
                  placeholder="Ej. D'Mendoza Premium"
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3F3F3F] uppercase tracking-wider mb-2">
                  Logotipo de Marca
                </label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed rounded-2xl p-6 flex flex-col items-center gap-2 cursor-pointer transition-colors border-gray-300 hover:bg-gray-50/50"
                >
                  {preview ? (
                    <img src={preview} alt="preview" className="h-24 object-contain rounded-xl border p-1 bg-white" />
                  ) : (
                    <>
                      <Upload size={28} className="text-gray-400" />
                      <p className="text-xs text-gray-500 font-bold">Haz click para subir logotipo</p>
                      <p className="text-[10px] text-gray-400">Formatos recomendados: JPEG, PNG, WEBP</p>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#D9D9D2]/30">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 border border-[#D9D9D2]/70 rounded-xl py-2.5 text-xs font-bold text-[#3F3F3F] hover:bg-[#FAFAFA] transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="flex-1 bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 text-white rounded-xl py-2.5 text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  <span>{submitting ? 'Guardando...' : 'Guardar Marca'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandsPage;
