import React, { useEffect, useState } from 'react';
import { useBanners } from './hooks/useBanners';
import type { Banner } from './types/banner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { 
  Plus, 
  Trash2, 
  Link as LinkIcon, 
  Loader2, 
  GripVertical, 
  X, 
  Image as ImageIcon,
  AlertCircle,
  ImagePlus
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Componente de Item Ordenable (Sortable)
interface SortableItemProps {
  banner: Banner;
  onToggle: (id: number, current: boolean) => void;
  onDelete: (id: number) => void;
  onEditLink: (banner: Banner) => void;
  onEditImage: (banner: Banner) => void;
}

const SortableBannerItem: React.FC<SortableItemProps> = ({ 
  banner, 
  onToggle, 
  onDelete, 
  onEditLink,
  onEditImage
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: banner.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 bg-[#D9D9D2]/20 hover:bg-[#D9D9D2]/40 border border-[#D9D9D2] p-4 rounded-xl transition-all ${
        isDragging ? 'shadow-2xl border-[#3F3F3F] opacity-90 scale-[1.02]' : 'shadow-sm'
      }`}
    >
      {/* Control de arrastre */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-2 text-[#3F3F3F]/60 hover:text-[#3F3F3F] rounded-lg hover:bg-white/50 transition-colors"
        title="Arrastrar para reordenar"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      {/* Miniatura de Imagen */}
      <div className="relative w-36 h-20 rounded-lg overflow-hidden border border-[#D9D9D2] bg-white flex-shrink-0">
        <img
          src={banner.imageUrl}
          alt={`Banner ${banner.order}`}
          className="w-full h-full object-cover"
        />
        {!banner.isActive && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white text-xs font-semibold px-2 py-0.5 rounded bg-black/60">
              Inactivo
            </span>
          </div>
        )}
      </div>

      {/* Información del Banner */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#3F3F3F] text-white">
            Orden {banner.order + 1}
          </span>
          {banner.linkUrl ? (
            <span className="text-xs flex items-center gap-1 text-[#3F3F3F]/70 truncate max-w-[200px]">
              <LinkIcon className="w-3.5 h-3.5" />
              {banner.linkUrl}
            </span>
          ) : (
            <span className="text-xs text-slate-400 italic">Sin enlace redirección</span>
          )}
        </div>
        <p className="text-xs text-slate-500 truncate">
          ID: {banner.id} • Subido el {new Date(banner.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Controles de Acción */}
      <div className="flex items-center gap-3">
        {/* Cambiar imagen */}
        <button
          onClick={() => onEditImage(banner)}
          className="p-2 text-xs font-medium text-[#3F3F3F] border border-[#3F3F3F]/30 hover:border-[#3F3F3F] rounded-lg hover:bg-white/50 transition-all flex items-center gap-1.5"
          title="Cambiar Imagen"
        >
          <ImagePlus className="w-4 h-4" />
          <span className="hidden sm:inline">Imagen</span>
        </button>

        {/* Cambiar link */}
        <button
          onClick={() => onEditLink(banner)}
          className="p-2 text-xs font-medium text-[#3F3F3F] border border-[#3F3F3F]/30 hover:border-[#3F3F3F] rounded-lg hover:bg-white/50 transition-all"
        >
          Editar Link
        </button>

        {/* Toggle Activo */}
        <button
          onClick={() => onToggle(banner.id, banner.isActive)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            banner.isActive ? 'bg-[#3F3F3F]' : 'bg-slate-300'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              banner.isActive ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>

        {/* Eliminar */}
        <button
          onClick={() => onDelete(banner.id)}
          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
          title="Eliminar Banner"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export const BannersPage: React.FC = () => {
  const {
    banners,
    loading,
    fetchBanners,
    createBanner,
    updateBanner,
    toggleBannerStatus,
    deleteBanner,
    reorderBanners,
  } = useBanners();

  // Estados del Formulario / Modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState<Banner | null>(null);
  const [showImageModal, setShowImageModal] = useState<Banner | null>(null);
  const [uploading, setUploading] = useState(false);

  // Formulario Nuevo Banner
  const [newImage, setNewImage] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string>('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [editLinkUrl, setEditLinkUrl] = useState('');

  // Formulario Reemplazar Imagen
  const [replaceImage, setReplaceImage] = useState<File | null>(null);
  const [replaceImagePreview, setReplaceImagePreview] = useState<string>('');

  // Configuración de Sensores para Drag & Drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Previene arrastres accidentales al hacer clic
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  // Manejo de subida de imagen (Preview)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen no debe superar los 5MB');
        return;
      }
      setNewImage(file);
      setNewImagePreview(URL.createObjectURL(file));
    }
  };

  // Crear Banner
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImage) {
      toast.error('La imagen del banner es requerida');
      return;
    }

    setUploading(true);
    const success = await createBanner({
      image: newImage,
      linkUrl: newLinkUrl || undefined,
      order: banners.length,
    });
    setUploading(false);

    if (success) {
      setShowAddModal(false);
      setNewImage(null);
      setNewImagePreview('');
      setNewLinkUrl('');
    }
  };

  // Guardar Link editado
  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showLinkModal) return;

    setUploading(true);
    const success = await updateBanner(showLinkModal.id, {
      linkUrl: editLinkUrl || '',
    });
    setUploading(false);

    if (success) {
      setShowLinkModal(null);
      setEditLinkUrl('');
    }
  };

  // Guardar Imagen editada
  const handleSaveImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showImageModal || !replaceImage) {
      toast.error('Selecciona una nueva imagen');
      return;
    }

    setUploading(true);
    const success = await updateBanner(showImageModal.id, {
      image: replaceImage,
    });
    setUploading(false);

    if (success) {
      setShowImageModal(null);
      setReplaceImage(null);
      setReplaceImagePreview('');
    }
  };

  // Eliminar Banner
  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este banner permanentemente?')) {
      await deleteBanner(id);
    }
  };

  // Drag End Handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = banners.findIndex((b) => b.id === active.id);
    const newIndex = banners.findIndex((b) => b.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedList = arrayMove(banners, oldIndex, newIndex);
      reorderBanners(reorderedList);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto min-h-screen bg-[#F7F7F5] text-[#3F3F3F]">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Banners</h1>
          <p className="text-slate-500 mt-1">
            Sube, activa y reordena los banners y sliders que se muestran en el Home del e-commerce.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 text-[#F7F7F5] px-6 py-2.5 rounded-xl font-medium shadow-md transition-all scale-100 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          Añadir Banner
        </button>
      </div>

      {/* Lista de Banners */}
      {loading && banners.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-[#3F3F3F] mb-4" />
          <p className="text-slate-500">Cargando banners del sistema...</p>
        </div>
      ) : banners.length === 0 ? (
        <div className="bg-white border border-[#D9D9D2] rounded-2xl p-12 text-center shadow-sm">
          <ImageIcon className="w-16 h-16 text-[#D9D9D2] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#3F3F3F]">No hay banners registrados</h3>
          <p className="text-slate-500 mt-2 max-w-md mx-auto">
            Sube tu primer banner publicitario para mostrar ofertas, promociones o colecciones en la página principal.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-6 inline-flex items-center gap-2 bg-[#3F3F3F] text-[#F7F7F5] px-5 py-2.5 rounded-xl font-medium transition-all hover:bg-[#3F3F3F]/90"
          >
            <Plus className="w-4 h-4" />
            Subir Banner
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex gap-3 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <span className="font-semibold">Tip de organización:</span> Puedes cambiar el orden de aparición arrastrando los elementos con el icono <GripVertical className="inline w-4 h-4" />. Los cambios se guardarán automáticamente en la base de datos.
            </div>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext items={banners.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-3">
                {banners.map((banner) => (
                  <SortableBannerItem
                    key={banner.id}
                    banner={banner}
                    onToggle={toggleBannerStatus}
                    onDelete={handleDelete}
                    onEditLink={(b) => {
                      setShowLinkModal(b);
                      setEditLinkUrl(b.linkUrl || '');
                    }}
                    onEditImage={(b) => {
                      setShowImageModal(b);
                      setReplaceImage(null);
                      setReplaceImagePreview('');
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* MODAL: AÑADIR BANNER */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#F7F7F5] rounded-2xl border border-[#D9D9D2] shadow-2xl max-w-lg w-full overflow-hidden animate-scaleUp">
            <div className="border-b border-[#D9D9D2] p-5 flex justify-between items-center bg-[#D9D9D2]/20">
              <h2 className="text-xl font-bold text-[#3F3F3F]">Nuevo Banner Publicitario</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-[#3F3F3F]/60 hover:text-[#3F3F3F] p-1 rounded-lg hover:bg-[#D9D9D2]/30"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-5">
              {/* Selector de Archivo */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#3F3F3F]">
                  Imagen del Banner <span className="text-red-500">*</span>
                </label>
                
                {newImagePreview ? (
                  <div className="relative border border-[#D9D9D2] rounded-xl overflow-hidden bg-white aspect-[21/9]">
                    <img 
                      src={newImagePreview} 
                      alt="Previsualización" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setNewImage(null);
                        setNewImagePreview('');
                      }}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full shadow transition-colors"
                      title="Quitar imagen"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#D9D9D2] hover:border-[#3F3F3F] bg-white rounded-xl p-8 cursor-pointer transition-all hover:bg-slate-50/50">
                    <ImageIcon className="w-10 h-10 text-slate-400 mb-2" />
                    <span className="text-sm font-medium text-[#3F3F3F]">Seleccionar Archivo</span>
                    <span className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP hasta 5MB (Recomendado: relación de aspecto apaisado)</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange} 
                      className="hidden" 
                    />
                  </label>
                )}
              </div>

              {/* URL de Enlace */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#3F3F3F]">
                  Enlace de Redirección (Opcional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#3F3F3F]/50">
                    <LinkIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    placeholder="https://ejemplo.com/coleccion-invierno"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-[#D9D9D2] bg-white rounded-xl outline-none focus:border-[#3F3F3F] transition-all text-sm"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Dirección URL a la que se redirigirá al cliente al hacer clic en el banner.
                </p>
              </div>

              {/* Acciones */}
              <div className="flex justify-end gap-3 pt-3 border-t border-[#D9D9D2]/40">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 border border-[#D9D9D2] hover:bg-[#D9D9D2]/20 text-[#3F3F3F] rounded-xl font-medium transition-all text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex items-center gap-2 bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 disabled:opacity-50 text-[#F7F7F5] px-6 py-2.5 rounded-xl font-semibold transition-all shadow text-sm"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    'Subir Banner'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR LINK */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#F7F7F5] rounded-2xl border border-[#D9D9D2] shadow-2xl max-w-md w-full overflow-hidden animate-scaleUp">
            <div className="border-b border-[#D9D9D2] p-5 flex justify-between items-center bg-[#D9D9D2]/20">
              <h2 className="text-xl font-bold text-[#3F3F3F]">Editar Enlace de Redirección</h2>
              <button 
                onClick={() => setShowLinkModal(null)}
                className="text-[#3F3F3F]/60 hover:text-[#3F3F3F] p-1 rounded-lg hover:bg-[#D9D9D2]/30"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveLink} className="p-6 space-y-4">
              <div className="relative border border-[#D9D9D2] rounded-lg overflow-hidden bg-white aspect-[21/9] mb-4">
                <img 
                  src={showLinkModal.imageUrl} 
                  alt="Banner actual" 
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#3F3F3F]">
                  Enlace de Redirección
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#3F3F3F]/50">
                    <LinkIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    placeholder="https://ejemplo.com/nueva-ruta"
                    value={editLinkUrl}
                    onChange={(e) => setEditLinkUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-[#D9D9D2] bg-white rounded-xl outline-none focus:border-[#3F3F3F] transition-all text-sm"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Deja el campo vacío si deseas remover el enlace de redirección por completo.
                </p>
              </div>

              {/* Acciones */}
              <div className="flex justify-end gap-3 pt-3 border-t border-[#D9D9D2]/40">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(null)}
                  className="px-5 py-2.5 border border-[#D9D9D2] hover:bg-[#D9D9D2]/20 text-[#3F3F3F] rounded-xl font-medium transition-all text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex items-center gap-2 bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 disabled:opacity-50 text-[#F7F7F5] px-6 py-2.5 rounded-xl font-semibold transition-all shadow text-sm"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Cambios'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CAMBIAR IMAGEN */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#F7F7F5] rounded-2xl border border-[#D9D9D2] shadow-2xl max-w-lg w-full overflow-hidden animate-scaleUp">
            <div className="border-b border-[#D9D9D2] p-5 flex justify-between items-center bg-[#D9D9D2]/20">
              <h2 className="text-xl font-bold text-[#3F3F3F]">Reemplazar Imagen del Banner</h2>
              <button 
                onClick={() => {
                  setShowImageModal(null);
                  setReplaceImage(null);
                  setReplaceImagePreview('');
                }}
                className="text-[#3F3F3F]/60 hover:text-[#3F3F3F] p-1 rounded-lg hover:bg-[#D9D9D2]/30"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveImage} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#3F3F3F]">
                  Seleccionar Nueva Imagen <span className="text-red-500">*</span>
                </label>
                
                {replaceImagePreview ? (
                  <div className="relative border border-[#D9D9D2] rounded-xl overflow-hidden bg-white aspect-[21/9]">
                    <img 
                      src={replaceImagePreview} 
                      alt="Previsualización de nueva imagen" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setReplaceImage(null);
                        setReplaceImagePreview('');
                      }}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full shadow transition-colors"
                      title="Quitar imagen"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#D9D9D2] hover:border-[#3F3F3F] bg-white rounded-xl p-8 cursor-pointer transition-all hover:bg-slate-50/50">
                    <ImageIcon className="w-10 h-10 text-slate-400 mb-2" />
                    <span className="text-sm font-medium text-[#3F3F3F]">Seleccionar Archivo</span>
                    <span className="text-xs text-slate-400 mt-1">Sustituirá la imagen actual del banner</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error('La imagen no debe superar los 5MB');
                            return;
                          }
                          setReplaceImage(file);
                          setReplaceImagePreview(URL.createObjectURL(file));
                        }
                      }} 
                      className="hidden" 
                    />
                  </label>
                )}
              </div>

              {/* Acciones */}
              <div className="flex justify-end gap-3 pt-3 border-t border-[#D9D9D2]/40">
                <button
                  type="button"
                  onClick={() => {
                    setShowImageModal(null);
                    setReplaceImage(null);
                    setReplaceImagePreview('');
                  }}
                  className="px-5 py-2.5 border border-[#D9D9D2] hover:bg-[#D9D9D2]/20 text-[#3F3F3F] rounded-xl font-medium transition-all text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading || !replaceImage}
                  className="flex items-center gap-2 bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 disabled:opacity-50 text-[#F7F7F5] px-6 py-2.5 rounded-xl font-semibold transition-all shadow text-sm"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Reemplazar Imagen'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannersPage;
