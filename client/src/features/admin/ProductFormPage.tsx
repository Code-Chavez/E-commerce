import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';
import { Upload, Star, X, Loader2, Sparkles, Folder, HelpCircle, ArrowLeft, RefreshCw, Layers, Image as ImageIcon, History } from 'lucide-react';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { VariantMatrix } from './components/VariantMatrix';
import { PriceHistory } from './components/PriceHistory';

interface SelectOption { id: number; name: string; }
interface ImagePreview { id?: number; file?: File; url: string; isMain: boolean; }

const schema = yup.object({
  code: yup.string()
    .required('El código base es obligatorio')
    .min(2, 'Debe tener al menos 2 caracteres')
    .max(10, 'No puede superar los 10 caracteres')
    .matches(/^[A-Z0-9]+$/, 'Solo letras mayúsculas y números (sin espacios)'),
  name: yup.string().required('El nombre es obligatorio'),
  model: yup.string().required('El modelo es obligatorio'),
  description: yup.string().nullable(),
  categoryId: yup.number().typeError('Selecciona una categoría').required('La categoría es obligatoria'),
  brandId: yup.number().typeError('Selecciona una marca').required('La marca es obligatoria'),
  genderId: yup.number().nullable(),
});

type FormData = yup.InferType<typeof schema>;

const ProductFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  useDocumentTitle(isEdit ? 'Editar Producto - E-Commerce' : 'Nuevo Producto - E-Commerce');
  const navigate = useNavigate();

  const [categories, setCategories] = useState<SelectOption[]>([]);
  const [brands, setBrands] = useState<SelectOption[]>([]);
  const [genders, setGenders] = useState<SelectOption[]>([]);
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const [productCode, setProductCode] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'variants' | 'images' | 'history'>('general');
  const dropRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceFileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema) as any,
  });

  useEffect(() => {
    Promise.all([
      axiosInstance.get('/v1/categories'),
      axiosInstance.get('/v1/brands'),
      axiosInstance.get('/v1/genders'),
    ]).then(([cats, brnds, gnds]) => {
      setCategories(cats.data.data);
      setBrands(brnds.data.data);
      setGenders(gnds.data.data);
    }).catch(() => toast.error('Error al cargar datos'));

    if (isEdit) {
      axiosInstance.get(`/v1/products/${id}`)
        .then(({ data }) => {
          reset(data.data);
          setProductCode(data.data.code);
          if (data.data.images) {
            const parentImages = data.data.images.filter((img: any) => !img.attributeValueId);
            setImages(parentImages.map((img: any) => ({
              id: img.id,
              url: img.url,
              isMain: img.isMain,
            })));
          }
        })
        .catch(() => toast.error('Error al cargar producto'));
    }
  }, [id, isEdit, reset]);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    Array.from(files).forEach(file => {
      if (!allowed.includes(file.type)) { toast.error(`${file.name}: solo JPEG/PNG/WEBP`); return; }
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name}: máx 5 MB`); return; }
      const url = URL.createObjectURL(file);
      setImages(prev => [...prev, { file, url, isMain: prev.length === 0 }]);
    });
  };

  const setMain = (index: number) =>
    setImages(prev => prev.map((img, i) => ({ ...img, isMain: i === index })));

  const removeImage = (index: number) => {
    const target = images[index];
    if (target.id) {
      setDeletedImageIds(prev => [...prev, target.id!]);
    }
    setImages(prev => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length > 0 && !next.some(img => img.isMain)) next[0].isMain = true;
      return next;
    });
  };

  const triggerReplace = (index: number) => {
    setReplaceIndex(index);
    replaceFileRef.current?.click();
  };

  const handleReplaceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || replaceIndex === null) return;
    const file = files[0];
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) { toast.error(`${file.name}: solo JPEG/PNG/WEBP`); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name}: máx 5 MB`); return; }

    const url = URL.createObjectURL(file);
    const oldImage = images[replaceIndex];
    if (oldImage.id) {
      setDeletedImageIds(prev => [...prev, oldImage.id!]);
    }

    setImages(prev => prev.map((img, idx) => idx === replaceIndex ? { file, url, isMain: img.isMain } : img));
    setReplaceIndex(null);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      let productId: number;
      if (isEdit) {
        await axiosInstance.patch(`/v1/products/${id}`, data);
        productId = Number(id);
        toast.success('Producto actualizado');
      } else {
        const { data: res } = await axiosInstance.post('/v1/products', data);
        productId = res.data.id;
        toast.success('Producto creado');
      }

      if (isEdit && deletedImageIds.length > 0) {
        await Promise.all(
          deletedImageIds.map(imageId =>
            axiosInstance.delete(`/v1/products/${productId}/images/${imageId}`)
          )
        );
      }

      const newImages = images.filter(img => img.file);
      if (newImages.length > 0) {
        const formData = new FormData();
        newImages.forEach(img => formData.append('images', img.file!));
        const mainNewIndex = newImages.findIndex(img => img.isMain);
        formData.append('isMain', String(mainNewIndex));
        await axiosInstance.post(`/v1/products/${productId}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      navigate('/admin/products');
    } catch (err: any) {
      const responseData = err.response?.data;
      if (responseData && responseData.errors) {
        Object.entries(responseData.errors).forEach(([field, msg]: any) => {
          setError(field as any, { type: 'server', message: msg });
        });
        toast.error('Corrige los errores en el formulario');
      } else if (responseData && responseData.message) {
        const errMsg = responseData.message.toLowerCase();
        if (errMsg.includes('sku') || errMsg.includes('código') || errMsg.includes('code')) {
          setError('code', { type: 'server', message: 'Este código base (SKU) ya está registrado' });
        } else if (errMsg.includes('model') || errMsg.includes('modelo')) {
          setError('model', { type: 'server', message: 'Este modelo ya está registrado' });
        }
        toast.error(responseData.message || 'Error al guardar producto');
      } else {
        toast.error('Error al guardar producto');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">

      {/* Back button and title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#D9D9D2]/40 pb-6">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-xs font-bold text-[#6B6B6B] hover:text-[#3F3F3F] transition-colors mb-2 uppercase tracking-widest"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al Catálogo</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-bold text-[#3F3F3F]/80 uppercase tracking-widest mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isEdit ? 'Edición de Ficha' : 'Registro de Ficha'}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#3F3F3F] tracking-tight">
            {isEdit ? 'Editar Producto' : 'Crear Producto'}
          </h1>
          <p className="text-sm text-[#6B6B6B] mt-1 max-w-xl">
            Llena los datos generales del producto para habilitar posteriormente su matriz de variantes de color, tallas y stock.
          </p>
        </div>
      </div>

      {/* Tabs */}
      {isEdit && (
        <div className="flex border-b border-[#D9D9D2]/40 gap-6">
          <button
            onClick={() => setActiveTab('general')}
            className={`pb-3 px-1 text-sm font-semibold border-b-2 transition duration-150 flex items-center gap-2 ${activeTab === 'general'
              ? 'border-[#3F3F3F] text-[#3F3F3F] border-[#3F3F3F]'
              : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
          >
            <Folder className="w-4 h-4" />
            <span>Ficha General</span>
          </button>
          <button
            onClick={() => setActiveTab('variants')}
            className={`pb-3 px-1 text-sm font-semibold border-b-2 transition duration-150 flex items-center gap-2 ${activeTab === 'variants'
              ? 'border-[#3F3F3F] text-[#3F3F3F] border-[#3F3F3F]'
              : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
          >
            <Layers className="w-4 h-4" />
            <span>Variantes y Stock</span>
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`pb-3 px-1 text-sm font-semibold border-b-2 transition duration-150 flex items-center gap-2 ${activeTab === 'images'
              ? 'border-[#3F3F3F] text-[#3F3F3F] border-[#3F3F3F]'
              : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Fotos por Color</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-1 text-sm font-semibold border-b-2 transition duration-150 flex items-center gap-2 ${activeTab === 'history'
              ? 'border-[#3F3F3F] text-[#3F3F3F] border-[#3F3F3F]'
              : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
          >
            <History className="w-4 h-4" />
            <span>Historial de Precios</span>
          </button>
        </div>
      )}

      {activeTab === 'general' && (
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Side fields */}
          <div className="lg:col-span-2 space-y-6">

            {/* General Information Card */}
            <div className="bg-white rounded-2xl border border-[#D9D9D2]/30 p-6 shadow-sm space-y-5">
              <h3 className="text-base font-bold text-[#3F3F3F] flex items-center gap-2 border-b border-[#D9D9D2]/40 pb-3">
                <Folder className="w-4 h-4 text-[#6B6B6B]" />
                <span>Información General</span>
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#3F3F3F] uppercase tracking-wider mb-2">
                      Nombre del Producto *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Camisa Oxford Premium Slim"
                      {...register('name')}
                      className={`w-full px-4 py-2.5 rounded-xl border bg-[#FAFAFA] text-sm text-[#3F3F3F] placeholder-[#6B6B6B]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]/20 focus:border-[#3F3F3F] transition-all ${errors.name ? 'border-red-500 ring-1 ring-red-500/20' : 'border-[#D9D9D2]/70'
                        }`}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.name.message}</p>}
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block text-xs font-bold text-[#3F3F3F] uppercase tracking-wider mb-2">
                      Código Base (SKU) *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. CAM, PAN, POL"
                      disabled={isEdit}
                      {...register('code')}
                      className={`w-full px-4 py-2.5 rounded-xl border bg-[#FAFAFA] text-sm text-[#3F3F3F] placeholder-[#6B6B6B]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]/20 focus:border-[#3F3F3F] transition-all uppercase disabled:opacity-60 disabled:cursor-not-allowed ${errors.code ? 'border-red-500 ring-1 ring-red-500/20' : 'border-[#D9D9D2]/70'
                        }`}
                    />
                    {errors.code && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.code.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3F3F3F] uppercase tracking-wider mb-2">
                    Modelo del Producto *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Oxford Slim Fit, Air Max 90"
                    {...register('model')}
                    className={`w-full px-4 py-2.5 rounded-xl border bg-[#FAFAFA] text-sm text-[#3F3F3F] placeholder-[#6B6B6B]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]/20 focus:border-[#3F3F3F] transition-all ${errors.model ? 'border-red-500 ring-1 ring-red-500/20' : 'border-[#D9D9D2]/70'
                      }`}
                  />
                  {errors.model && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.model.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3F3F3F] uppercase tracking-wider mb-2">
                    Descripción Detallada
                  </label>
                  <textarea
                    placeholder="Describe los detalles de la tela, corte, lavado..."
                    {...register('description')}
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#D9D9D2]/70 bg-[#FAFAFA] text-sm text-[#3F3F3F] placeholder-[#6B6B6B]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]/20 focus:border-[#3F3F3F] transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-[#3F3F3F] uppercase tracking-wider mb-2">
                      Categoría *
                    </label>
                    <select
                      {...register('categoryId', { valueAsNumber: true })}
                      className={`w-full px-4 py-2.5 rounded-xl border bg-[#FAFAFA] text-sm text-[#3F3F3F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]/20 focus:border-[#3F3F3F] transition-all appearance-none ${errors.categoryId ? 'border-red-500 ring-1 ring-red-500/20' : 'border-[#D9D9D2]/70'
                        }`}
                    >
                      <option value="">-- Seleccionar --</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {errors.categoryId && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.categoryId.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#3F3F3F] uppercase tracking-wider mb-2">
                      Marca *
                    </label>
                    <select
                      {...register('brandId', { valueAsNumber: true })}
                      className={`w-full px-4 py-2.5 rounded-xl border bg-[#FAFAFA] text-sm text-[#3F3F3F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]/20 focus:border-[#3F3F3F] transition-all appearance-none ${errors.brandId ? 'border-red-500 ring-1 ring-red-500/20' : 'border-[#D9D9D2]/70'
                        }`}
                    >
                      <option value="">-- Seleccionar --</option>
                      {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    {errors.brandId && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.brandId.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3F3F3F] uppercase tracking-wider mb-2">
                    Género
                  </label>
                  <select
                    {...register('genderId', {
                      setValueAs: (v) => v === '' ? null : Number(v)
                    })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#D9D9D2]/70 bg-[#FAFAFA] text-sm text-[#3F3F3F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]/20 focus:border-[#3F3F3F] transition-all appearance-none"
                  >
                    <option value="">-- Sin especificar (Unisex/Infantil) --</option>
                    {genders.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                  {errors.genderId && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.genderId.message}</p>}
                </div>
              </div>
            </div>

            {/* Visual Images Uploader Card */}
            <div className="bg-white rounded-2xl border border-[#D9D9D2]/30 p-6 shadow-sm space-y-5">
              <h3 className="text-base font-bold text-[#3F3F3F] flex items-center gap-2 border-b border-[#D9D9D2]/40 pb-3">
                <Upload className="w-4 h-4 text-[#6B6B6B]" />
                <span>Galería de Imágenes</span>
              </h3>

              <div
                ref={dropRef}
                onDrop={onDrop}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-2 cursor-pointer transition-all ${isDragging
                  ? 'border-[#3F3F3F] bg-[#D9D9D2]/10 scale-[0.99]'
                  : 'border-[#D9D9D2]/80 hover:bg-[#FAFAFA]/50 hover:border-[#3F3F3F]/40'
                  }`}
              >
                <Upload size={32} className={isDragging ? 'text-[#3F3F3F] animate-bounce' : 'text-gray-400'} />
                <p className="text-xs font-bold text-[#3F3F3F] mt-1">Arrastra imágenes aquí o <span className="text-[#3F3F3F]/80 underline">selecciona desde tu ordenador</span></p>
                <p className="text-[10px] text-gray-400">Archivos permitidos: JPEG, PNG, WEBP (Máx. 5 MB por archivo)</p>
              </div>
              <input ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => addFiles(e.target.files)} />
              <input ref={replaceFileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleReplaceFile} />

              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                  {images.map((img, i) => (
                    <div key={i} className="relative group rounded-xl overflow-hidden border border-[#D9D9D2]/40 aspect-square bg-[#FAFAFA] p-1 flex items-center justify-center">
                      <img src={img.url} alt="" className="max-w-full max-h-full object-contain rounded-lg" />

                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setMain(i)}
                          title="Hacer imagen principal"
                          className={`p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all ${img.isMain ? 'text-yellow-400' : 'text-white'}`}
                        >
                          <Star size={16} fill={img.isMain ? 'currentColor' : 'none'} />
                        </button>
                        <button
                          type="button"
                          onClick={() => triggerReplace(i)}
                          title="Reemplazar imagen"
                          className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white hover:text-blue-400 transition-all"
                        >
                          <RefreshCw size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          title="Eliminar imagen"
                          className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white hover:text-red-400 transition-all"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {img.isMain && (
                        <span className="absolute top-1.5 left-1.5 bg-yellow-400 border border-yellow-500 text-white text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-widest shadow-sm">
                          Principal
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Side summary block */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-[#D9D9D2]/30 p-6 shadow-sm space-y-6 sticky top-6">
              <h3 className="text-base font-bold text-[#3F3F3F] flex items-center gap-2 border-b border-[#D9D9D2]/40 pb-3">
                <HelpCircle className="w-4 h-4 text-[#6B6B6B]" />
                <span>Resumen y Envío</span>
              </h3>

              <div className="space-y-3.5 text-xs text-[#6B6B6B]">
                <div className="flex justify-between items-center">
                  <span>Imágenes cargadas</span>
                  <span className="font-bold text-[#3F3F3F]">{images.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Estado de Ficha</span>
                  <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/50 uppercase tracking-widest text-[9px]">Completo</span>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-4 border-t border-[#D9D9D2]/40">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 text-white py-3.5 rounded-xl hover:bg-[#1e1e1a] transition-all text-sm font-semibold shadow-lg shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Guardando Ficha...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{isEdit ? 'Actualizar Ficha' : 'Guardar Ficha'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="w-full border border-[#D9D9D2]/70 rounded-xl py-3 text-xs font-bold text-[#6B6B6B] hover:bg-[#FAFAFA] hover:text-[#3F3F3F] transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>

        </form>
      )}

      {activeTab === 'variants' && isEdit && (
        <div className="bg-white rounded-2xl border border-[#D9D9D2]/30 p-6 shadow-sm">
          <VariantMatrix productId={Number(id)} productCode={productCode} mode="variants" />
        </div>
      )}

      {activeTab === 'images' && isEdit && (
        <div className="bg-white rounded-2xl border border-[#D9D9D2]/30 p-6 shadow-sm">
          <VariantMatrix productId={Number(id)} productCode={productCode} mode="images" />
        </div>
      )}

      {activeTab === 'history' && isEdit && (
        <div className="bg-white rounded-2xl border border-[#D9D9D2]/30 p-6 shadow-sm">
          <PriceHistory productId={Number(id)} />
        </div>
      )}
    </div>
  );
};

export default ProductFormPage;
