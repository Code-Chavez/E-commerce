import React, { useEffect, useState, useMemo } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Pencil, 
  XCircle, 
  ChevronDown, 
  ChevronRight, 
  Loader2, 
  Sparkles, 
  Search, 
  Sliders, 
  Tag, 
  PlusCircle, 
  AlertCircle 
} from 'lucide-react';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';

interface AttributeValue { id: number; value: string; isActive: boolean; }
interface Attribute { id: number; name: string; isActive: boolean; values: AttributeValue[]; isVisualDriver?: boolean; }

const AttributesPage: React.FC = () => {
  useDocumentTitle('Gestión de Atributos - D\'Mendoza');

  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [newValueInputs, setNewValueInputs] = useState<Record<number, string>>({});
  const [showAttrModal, setShowAttrModal] = useState(false);
  const [editingAttr, setEditingAttr] = useState<Attribute | null>(null);
  const [attrName, setAttrName] = useState('');
  const [isVisualDriver, setIsVisualDriver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetch = async () => {
    try {
      const { data } = await axiosInstance.get('/v1/attributes');
      setAttributes(data.data);
    } catch { 
      toast.error('Error al cargar atributos'); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetch(); 
  }, []);

  const toggle = (id: number) => setExpanded(s => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const openCreate = () => { setEditingAttr(null); setAttrName(''); setIsVisualDriver(false); setShowAttrModal(true); };
  const openEdit = (a: Attribute) => { setEditingAttr(a); setAttrName(a.name); setIsVisualDriver(!!a.isVisualDriver); setShowAttrModal(true); };

  const handleSaveAttr = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingAttr) {
        await axiosInstance.patch(`/v1/attributes/${editingAttr.id}`, { name: attrName, isVisualDriver });
        toast.success('Atributo actualizado');
      } else {
        await axiosInstance.post('/v1/attributes', { name: attrName, isVisualDriver });
        toast.success('Atributo creado');
      }
      setShowAttrModal(false);
      fetch();
    } catch { 
      toast.error('Error al guardar'); 
    } finally { 
      setSubmitting(false); 
    }
  };

  const handleDeactivateAttr = async (id: number) => {
    if (!confirm('¿Inactivar este atributo?')) return;
    try {
      await axiosInstance.delete(`/v1/attributes/${id}`);
      toast.success('Atributo inactivado');
      fetch();
    } catch { 
      toast.error('Error al inactivar'); 
    }
  };

  const handleAddValue = async (attrId: number) => {
    const val = (newValueInputs[attrId] ?? '').trim();
    if (!val) return;
    try {
      await axiosInstance.post(`/v1/attributes/${attrId}/values`, { value: val });
      toast.success('Valor agregado');
      setNewValueInputs(s => ({ ...s, [attrId]: '' }));
      fetch();
    } catch { 
      toast.error('Error al agregar valor'); 
    }
  };

  const handleDeactivateValue = async (attrId: number, valueId: number) => {
    try {
      await axiosInstance.delete(`/v1/attributes/${attrId}/values/${valueId}`);
      toast.success('Valor inactivado');
      fetch();
    } catch { 
      toast.error('Error al inactivar valor'); 
    }
  };

  // Search filtering
  const filteredAttributes = useMemo(() => {
    return attributes.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [attributes, searchTerm]);

  // Compute stats KPIs
  const stats = useMemo(() => {
    const total = attributes.length;
    const active = attributes.filter(a => a.isActive).length;
    const totalValues = attributes.reduce((acc, curr) => acc + curr.values.filter(v => v.isActive).length, 0);
    return { total, active, totalValues };
  }, [attributes]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#D9D9D2]/40 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#3F3F3F]/80 uppercase tracking-widest mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Módulo de Características</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#3F3F3F] tracking-tight">
            Atributos de Variante
          </h1>
          <p className="text-sm text-[#6B6B6B] mt-1 max-w-2xl">
            Define las especificaciones de prendas (como Tallas, Colores, Texturas) para dar soporte al generador de SKUs.
          </p>
        </div>

        <button 
          onClick={openCreate} 
          className="flex items-center gap-2 bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 text-white font-bold px-5 py-2.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow hover:scale-[1.01] self-start md:self-auto cursor-pointer text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Atributo</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-[#D9D9D2]/50 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-200">
          <div className="p-3 bg-[#F7F7F5] text-[#3F3F3F] rounded-xl border border-[#D9D9D2]/30">
            <Sliders className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Atributos Totales</p>
            <h3 className="text-2xl font-bold text-[#3F3F3F] mt-0.5">{stats.total}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D9D9D2]/50 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-200">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <Tag className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Valores Activos</p>
            <h3 className="text-2xl font-bold text-[#3F3F3F] mt-0.5">{stats.totalValues}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D9D9D2]/50 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-200">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <Sparkles className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Atributos Activos</p>
            <h3 className="text-2xl font-bold text-[#3F3F3F] mt-0.5">{stats.active}</h3>
          </div>
        </div>
      </div>

      {/* Filter and Accordion */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-[#D9D9D2]/50 max-w-md shadow-sm focus-within:ring-1 focus-within:ring-[#3F3F3F] focus-within:border-[#3F3F3F]">
          <Search className="w-5 h-5 text-[#6B6B6B]/60" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar atributos..."
            className="w-full bg-transparent border-none outline-none text-sm text-[#3F3F3F] placeholder-[#6B6B6B]/40"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#3F3F3F] animate-spin" />
            <p className="text-sm text-[#6B6B6B] mt-2">Cargando catálogo de características...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAttributes.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-10 bg-white border border-[#D9D9D2]/30 rounded-2xl">
                {searchTerm ? 'No se encontraron atributos con la búsqueda.' : 'No hay atributos generales registrados.'}
              </p>
            ) : (
              filteredAttributes.map(attr => {
                const isOpen = expanded.has(attr.id);
                return (
                  <div key={attr.id} className="bg-white border border-[#D9D9D2]/30 rounded-2xl overflow-hidden shadow-sm hover:border-[#D9D9D2]/80 transition-colors">
                    
                    {/* Accordion Trigger row */}
                    <div 
                      className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[#FAFAFA]/40 transition-colors"
                      onClick={() => toggle(attr.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[#6B6B6B]">
                          {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </span>
                        <span className={`font-bold text-sm text-[#3F3F3F] truncate ${!attr.isActive ? 'text-gray-400 line-through font-normal' : ''}`}>
                          {attr.name} {attr.isVisualDriver && <span title="Atributo Conductor Visual" className="ml-1 text-xs">🖼️</span>}
                        </span>
                        <span className="text-[10px] font-extrabold text-[#6B6B6B] bg-[#FAFAFA] border px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                          {attr.values.length} valores
                        </span>
                      </div>

                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => openEdit(attr)} 
                          className="p-1.5 rounded-lg text-gray-400 hover:text-[#3F3F3F] hover:bg-gray-100 transition-colors"
                          title="Editar Nombre de Atributo"
                        >
                          <Pencil size={14} />
                        </button>
                        {attr.isActive && (
                          <button 
                            onClick={() => handleDeactivateAttr(attr.id)} 
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Inactivar Atributo"
                          >
                            <XCircle size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Accordion Content values block */}
                    {isOpen && (
                      <div className="border-t border-[#D9D9D2]/30 px-6 py-4 bg-[#FAFAFA]/30 space-y-4 animate-in fade-in duration-200">
                        
                        {/* Subheading */}
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider">
                          <Sliders className="w-3.5 h-3.5 text-gray-400" />
                          <span>Valores definidos de variante</span>
                        </div>

                        {/* Badges list */}
                        <div className="flex flex-wrap gap-2.5">
                          {attr.values.length === 0 ? (
                            <span className="text-xs text-gray-400 flex items-center gap-1.5 py-1">
                              <AlertCircle className="w-4 h-4" />
                              <span>Sin valores asignados a la propiedad. Agrega uno debajo para comenzar.</span>
                            </span>
                          ) : (
                            attr.values.map(v => (
                              <span 
                                key={v.id} 
                                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                                  v.isActive 
                                    ? 'bg-white border-[#D9D9D2]/70 text-[#3F3F3F] hover:border-[#3F3F3F]/40' 
                                    : 'bg-gray-50 border-gray-200 text-gray-400 line-through'
                                }`}
                              >
                                <span>{v.value}</span>
                                {v.isActive && (
                                  <button 
                                    onClick={() => handleDeactivateValue(attr.id, v.id)} 
                                    className="text-gray-400 hover:text-red-600 transition-colors p-0.5 rounded-full hover:bg-red-50"
                                    title="Inactivar valor"
                                  >
                                    <XCircle size={13} />
                                  </button>
                                )}
                              </span>
                            ))
                          )}
                        </div>

                        {/* Insert new value box */}
                        <div className="flex gap-2 max-w-md pt-2">
                          <input
                            className="flex-grow px-3.5 py-2 rounded-xl border border-[#D9D9D2]/70 bg-white text-xs text-[#3F3F3F] placeholder-[#6B6B6B]/40 focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]/20 focus:border-[#3F3F3F] transition-all"
                            placeholder="Nuevo valor (ej: XL, Navy, Algodón)..."
                            value={newValueInputs[attr.id] ?? ''}
                            onChange={e => setNewValueInputs(s => ({ ...s, [attr.id]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && handleAddValue(attr.id)}
                          />
                          <button 
                            onClick={() => handleAddValue(attr.id)} 
                            className="bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 text-white px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:scale-[1.01] active:scale-[0.99] transition-all shrink-0"
                          >
                            <PlusCircle size={14} />
                            <span>Agregar</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Creation/Edition Modal */}
      {showAttrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-[#1e1e1a]/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setShowAttrModal(false)}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl border border-[#D9D9D2]/30 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-bold text-[#3F3F3F] border-b border-[#D9D9D2]/40 pb-3 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#6B6B6B]" />
              <span>{editingAttr ? 'Editar Atributo' : 'Nuevo Atributo'}</span>
            </h2>

            <form onSubmit={handleSaveAttr} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#3F3F3F] uppercase tracking-wider mb-2">
                  Nombre de Atributo *
                </label>
                <input
                  className="w-full px-4 py-2.5 rounded-xl border border-[#D9D9D2]/70 bg-[#FAFAFA] text-sm text-[#3F3F3F] placeholder-[#6B6B6B]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]/20 focus:border-[#3F3F3F] transition-all"
                  placeholder="Ej. Talla, Color, Composición..."
                  value={attrName}
                  onChange={e => setAttrName(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="isVisualDriver"
                  checked={isVisualDriver}
                  onChange={e => setIsVisualDriver(e.target.checked)}
                  className="rounded border-gray-300 text-[#3F3F3F] focus:ring-[#3F3F3F]"
                />
                <label htmlFor="isVisualDriver" className="text-xs font-bold text-[#3F3F3F] cursor-pointer select-none">
                  Atributo Conductor Visual (isVisualDriver) 🖼️
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#D9D9D2]/30">
                <button 
                  type="button" 
                  onClick={() => setShowAttrModal(false)} 
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
                  <span>{submitting ? 'Guardando...' : 'Guardar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttributesPage;
