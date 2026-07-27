import React, { useState, useEffect, useMemo } from 'react';
import { useVariants } from '../hooks/useVariants';
import type { ProductVariant } from '../types/variant';
import axiosInstance from '@/shared/api/axiosInstance';
import toast from 'react-hot-toast';
import { Upload, Trash2, Image as ImageIcon, Loader2, Check, X, RefreshCw, Edit2, AlertCircle, Save, XCircle } from 'lucide-react';
import { handleNumericKeyDown } from '@/shared/validation/documentValidators';

interface VariantMatrixProps {
  productId: number;
  productCode: string;
  mode?: 'all' | 'variants' | 'images';
}

export const VariantMatrix: React.FC<VariantMatrixProps> = ({ productId, productCode, mode }) => {
  const { variants, loading, fetchVariants, generateVariants, updateVariant } = useVariants(productId);
  const [productImages, setProductImages] = useState<any[]>([]);

  // DB Attributes types
  interface AttributeValue { id: number; value: string; isActive: boolean; }
  interface Attribute { id: number; name: string; isActive: boolean; values: AttributeValue[]; isVisualDriver?: boolean; }

  // Attributes from server
  const [dbAttributes, setDbAttributes] = useState<Attribute[]>([]);
  const [loadingAttrs, setLoadingAttrs] = useState<boolean>(true);

  // Form visibility state
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  
  // Creation mode state
  const [creationMode, setCreationMode] = useState<'automatic' | 'manual'>('automatic');

  // States for automatic generation
  const [selectedAutoValues, setSelectedAutoValues] = useState<Record<string, string[]>>({});
  const [basePrice, setBasePrice] = useState<number>(99.90);
  const [baseCostPrice, setBaseCostPrice] = useState<number>(0);

  // States for manual input
  const [selectedManualValues, setSelectedManualValues] = useState<Record<string, string>>({});
  const [manualPrice, setManualPrice] = useState<number>(99.90);
  const [manualCostPrice, setManualCostPrice] = useState<number>(0);
  const [manualSku, setManualSku] = useState<string>('');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editCostPrice, setEditCostPrice] = useState<number>(0);
  const [editSku, setEditSku] = useState<string>('');
  const [editDiscount, setEditDiscount] = useState<number>(0);

  // Bulk discount state
  const [bulkDiscount, setBulkDiscount] = useState<number | ''>('');
  const [isApplyingBulkDiscount, setIsApplyingBulkDiscount] = useState<boolean>(false);

  useEffect(() => {
    fetchVariants();
  }, [productId, fetchVariants]);

  const fetchProductImages = async () => {
    try {
      const { data } = await axiosInstance.get(`/v1/products/${productId}`);
      if (data.success && data.data.images) {
        setProductImages(data.data.images);
      }
    } catch (err) {
      console.error('Error fetching product images:', err);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchProductImages();
    }
  }, [productId]);

  // Sync panel visibility: show by default if no variants exist
  useEffect(() => {
    if (variants.length === 0) {
      setShowAddForm(true);
    }
  }, [variants.length]);

  // Fetch attributes
  useEffect(() => {
    const fetchDbAttributes = async () => {
      try {
        const { data } = await axiosInstance.get('/v1/attributes');
        if (data.success) {
          // Filter only active attributes that have at least one active value
          const activeAttrs = (data.data as Attribute[])
            .filter((attr) => attr.isActive)
            .map((attr) => ({
              ...attr,
              values: attr.values.filter((val) => val.isActive),
            }))
            .filter((attr) => attr.values.length > 0);
          setDbAttributes(activeAttrs);
        }
      } catch (err) {
        console.error('Error al cargar atributos para variantes:', err);
      } finally {
        setLoadingAttrs(false);
      }
    };
    fetchDbAttributes();
  }, []);

  const handleAutoCheckboxChange = (attrKey: string, value: string, checked: boolean) => {
    setSelectedAutoValues((prev) => {
      const current = prev[attrKey] || [];
      const updated = checked
        ? [...current, value]
        : current.filter((v) => v !== value);
      return { ...prev, [attrKey]: updated };
    });
  };

  const handleManualSelectChange = (attrKey: string, value: string) => {
    setSelectedManualValues((prev) => ({
      ...prev,
      [attrKey]: value,
    }));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check that we have at least one attribute with a selected value
    const attributesPayload: Record<string, string[]> = {};
    Object.entries(selectedAutoValues).forEach(([key, vals]) => {
      if (vals.length > 0) {
        attributesPayload[key] = vals;
      }
    });

    if (Object.keys(attributesPayload).length === 0) {
      alert('Debes seleccionar al menos un valor de algún atributo para generar variantes.');
      return;
    }

    if (baseCostPrice > basePrice) {
      alert('El precio de costo no puede ser mayor al precio de venta.');
      return;
    }

    await generateVariants({
      attributes: attributesPayload,
      basePrice,
      baseCostPrice,
    });
  };

  const handleGenerateManual = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check that all active attributes have a selected value
    const attributesPayload: Record<string, string[]> = {};
    let missingAttribute = false;

    dbAttributes.forEach((attr) => {
      const attrKey = attr.name.toLowerCase();
      const val = selectedManualValues[attrKey];
      if (!val) {
        missingAttribute = true;
      } else {
        attributesPayload[attrKey] = [val];
      }
    });

    if (missingAttribute) {
      alert('Debes seleccionar un valor para cada uno de los atributos activos.');
      return;
    }

    if (manualPrice <= 0) {
      alert('El precio debe ser mayor a 0.');
      return;
    }

    if (manualCostPrice > manualPrice) {
      alert('El precio de costo no puede ser mayor al precio de venta.');
      return;
    }

    // Call generateVariants with a single combination
    const newVariants = await generateVariants({
      attributes: attributesPayload,
      basePrice: manualPrice,
      baseCostPrice: manualCostPrice,
    });

    if (newVariants) {
      // Find the newly created variant (we match all attribute values)
      const newVar = newVariants.find((v) => {
        return dbAttributes.every((attr) => {
          const attrKey = attr.name.toLowerCase();
          const expectedVal = selectedManualValues[attrKey];
          return v.attributesJson[attrKey]?.toUpperCase() === expectedVal.toUpperCase();
        });
      });

      if (newVar && manualSku.trim()) {
        const skuClean = manualSku.trim().toUpperCase();
        await updateVariant(newVar.id, {
          sku: skuClean,
          price: manualPrice,
        });
      }

      // Clear manual selections
      setSelectedManualValues({});
      setManualSku('');
    }
  };

  const startEdit = (v: ProductVariant) => {
    setEditingId(v.id);
    setEditPrice(v.price);
    setEditCostPrice(v.costPrice ?? 0);
    setEditSku(v.sku);
    setEditDiscount(v.discountPercent ?? 0);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const visualDriverValues = useMemo(() => {
    const valuesMap: Record<number, { value: string; attributeName: string }> = {};
    dbAttributes.forEach(attr => {
      if (attr.isVisualDriver) {
        attr.values.forEach(val => {
          const attrKey = attr.name.toLowerCase();
          const isUsed = variants.some(v => 
            v.attributesJson[attrKey]?.toUpperCase() === val.value.toUpperCase()
          );
          if (isUsed) {
            valuesMap[val.id] = { value: val.value, attributeName: attr.name };
          }
        });
      }
    });
    return Object.entries(valuesMap).map(([id, info]) => ({
      id: Number(id),
      value: info.value,
      attributeName: info.attributeName,
    }));
  }, [dbAttributes, variants]);

  const [uploadingColorIds, setUploadingColorIds] = useState<Record<number, boolean>>({});
  const [dragOverColorId, setDragOverColorId] = useState<number | null>(null);

  const handleDragOver = (e: React.DragEvent, valId: number) => {
    e.preventDefault();
    setDragOverColorId(valId);
  };

  const handleDragLeave = () => {
    setDragOverColorId(null);
  };

  const handleDrop = (e: React.DragEvent, valId: number) => {
    e.preventDefault();
    setDragOverColorId(null);
    handleUploadImages(valId, e.dataTransfer.files);
  };

  const handleUploadImages = async (valId: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingColorIds(prev => ({ ...prev, [valId]: true }));
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('images', file);
    });
    formData.append('attributeValueId', String(valId));
    formData.append('isMain', 'false');

    try {
      const { data } = await axiosInstance.post(`/v1/products/${productId}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (data.success) {
        toast.success('Imágenes subidas');
        fetchProductImages();
      }
    } catch {
      toast.error('Error al subir imágenes');
    } finally {
      setUploadingColorIds(prev => ({ ...prev, [valId]: false }));
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('¿Eliminar esta imagen?')) return;
    try {
      const { data } = await axiosInstance.delete(`/v1/products/${productId}/images/${imageId}`);
      if (data.success) {
        toast.success('Imagen eliminada');
        fetchProductImages();
      }
    } catch {
      toast.error('Error al eliminar imagen');
    }
  };

  const handleSave = async (variantId: number) => {
    if (editPrice <= 0) {
      alert('El precio debe ser mayor a 0');
      return;
    }
    if (editDiscount < 0 || editDiscount > 99) {
      alert('El descuento debe estar entre 0 y 99');
      return;
    }
    if (!editSku.trim()) {
      alert('El SKU no puede estar vacío');
      return;
    }
    if (editCostPrice < 0) {
      alert('El precio de costo no puede ser negativo');
      return;
    }
    if (editCostPrice > editPrice) {
      alert('El precio de costo no puede ser mayor al precio de venta');
      return;
    }

    const success = await updateVariant(variantId, {
      price: editPrice,
      costPrice: editCostPrice,
      sku: editSku,
      discountPercent: editDiscount,
    });

    if (success) {
      setEditingId(null);
    }
  };

  const handleApplyBulkDiscount = async () => {
    const discountVal = Number(bulkDiscount);
    if (discountVal < 0 || discountVal > 99) {
      alert('El descuento debe estar entre 0 y 99');
      return;
    }
    
    setIsApplyingBulkDiscount(true);
    let allSuccess = true;
    for (const v of variants) {
      if (v.discountPercent !== discountVal) {
        const success = await updateVariant(v.id, { discountPercent: discountVal });
        if (!success) allSuccess = false;
      }
    }
    if (allSuccess) {
      setBulkDiscount('');
      toast.success('Descuento masivo aplicado a las variantes');
    }
    setIsApplyingBulkDiscount(false);
  };

  const handleToggleActive = async (v: ProductVariant) => {
    await updateVariant(v.id, {
      isActive: !v.isActive,
    });
  };

  const showVariantsSection = !mode || mode === 'all' || mode === 'variants';
  const showImagesSection = !mode || mode === 'all' || mode === 'images';

  return (
    <div className={mode ? "w-full" : "bg-brand-bg rounded-xl p-6 shadow-sm border border-gray-100 max-w-5xl mx-auto my-8"}>
      {showVariantsSection && (
        <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 pb-4 mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-brand-accent">Matriz de Variantes SKU</h2>
          <p className="text-sm text-brand-text mt-1">
            Código Base: <span className="font-mono bg-gray-200 px-2 py-0.5 rounded text-xs">{productCode}</span>
          </p>
        </div>
        <div className="flex items-center gap-3 mt-2 md:mt-0">
          {variants.length > 0 && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="text-xs font-semibold bg-brand-accent hover:opacity-90 text-white px-3 py-1.5 rounded-lg transition"
            >
              {showAddForm ? 'Ocultar Panel' : 'Agregar Variante'}
            </button>
          )}
          <span className="text-xs font-medium text-brand-text bg-brand-primary px-3 py-1.5 rounded-lg shrink-0">
            ID Producto: #{productId}
          </span>
        </div>
      </div>

      {/* Generator Section */}
      {showAddForm && (
        <div className="bg-white rounded-lg p-6 border border-gray-200 mb-8">
          <div className="flex border-b border-gray-200 mb-5">
            <button
              onClick={() => setCreationMode('automatic')}
              className={`pb-2.5 px-4 text-sm font-semibold border-b-2 transition duration-150 ${
                creationMode === 'automatic'
                  ? 'border-brand-accent text-brand-accent'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Generación Masiva (Combinaciones)
            </button>
            <button
              onClick={() => setCreationMode('manual')}
              className={`pb-2.5 px-4 text-sm font-semibold border-b-2 transition duration-150 ${
                creationMode === 'manual'
                  ? 'border-brand-accent text-brand-accent'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Ingreso Manual (Uno a Uno)
            </button>
          </div>

          {creationMode === 'automatic' ? (
            <form onSubmit={handleGenerate} className="space-y-6">
              {loadingAttrs ? (
                <div className="text-sm text-brand-text">Cargando atributos...</div>
              ) : dbAttributes.length === 0 ? (
                <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                  No hay atributos activos registrados en el sistema. Regístralos en la sección de <a href="/admin/attributes" className="underline font-bold">Gestión de Atributos</a>.
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-brand-accent uppercase tracking-wider">Valores a combinar para las variantes:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dbAttributes.map((attr) => {
                      const attrKey = attr.name.toLowerCase();
                      return (
                        <div key={attr.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
                          <label className="block text-xs font-extrabold text-brand-accent uppercase mb-2 tracking-wider">
                            {attr.name}
                          </label>
                          {attr.values.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">Sin valores registrados</p>
                          ) : (
                            <div className="flex flex-wrap gap-3">
                              {attr.values.map((val) => {
                                const isChecked = (selectedAutoValues[attrKey] || []).includes(val.value);
                                return (
                                  <label key={val.id} className="inline-flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700 cursor-pointer hover:border-brand-accent transition select-none">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => handleAutoCheckboxChange(attrKey, val.value, e.target.checked)}
                                      className="rounded border-gray-300 text-brand-accent focus:ring-brand-accent"
                                    />
                                    <span>{val.value}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end pt-4 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-semibold text-brand-text uppercase mb-1">Precio Costo Base (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={baseCostPrice}
                    onKeyDown={handleNumericKeyDown}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val < 0) return;
                      setBaseCostPrice(isNaN(val) ? 0 : val);
                    }}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2.5 focus:ring-1 focus:ring-brand-accent focus:border-brand-accent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-text uppercase mb-1">Precio Venta Base (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={basePrice}
                    onKeyDown={handleNumericKeyDown}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val < 0) return;
                      setBasePrice(isNaN(val) ? 0 : val);
                    }}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2.5 focus:ring-1 focus:ring-brand-accent focus:border-brand-accent outline-none"
                  />
                </div>
                <div className="text-xs font-bold pb-3">
                  {basePrice > 0 && (
                    <span className={baseCostPrice > basePrice ? 'text-rose-600' : 'text-emerald-700'}>
                      Margen: S/ {(basePrice - baseCostPrice).toFixed(2)} ({basePrice > 0 ? (((basePrice - baseCostPrice) / basePrice) * 100).toFixed(1) : 0}%)
                    </span>
                  )}
                </div>
                <div>
                  <button
                    type="submit"
                    disabled={loading || dbAttributes.length === 0}
                    className="w-full bg-brand-accent hover:opacity-90 text-white text-sm font-bold py-2.5 rounded-xl transition duration-200 disabled:opacity-50"
                  >
                    {loading ? 'Generando...' : 'Generar Combinaciones'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleGenerateManual} className="space-y-6">
              {loadingAttrs ? (
                <div className="text-sm text-brand-text">Cargando atributos...</div>
              ) : dbAttributes.length === 0 ? (
                <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                  No hay atributos activos registrados en el sistema. Regístralos en la sección de <a href="/admin/attributes" className="underline font-bold">Gestión de Atributos</a>.
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-brand-accent uppercase tracking-wider">Selecciona los valores de los atributos:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dbAttributes.map((attr) => {
                      const attrKey = attr.name.toLowerCase();
                      return (
                        <div key={attr.id}>
                          <label className="block text-xs font-extrabold text-brand-accent uppercase mb-1.5 tracking-wider">
                            {attr.name}
                          </label>
                          <select
                            required
                            value={selectedManualValues[attrKey] || ''}
                            onChange={(e) => handleManualSelectChange(attrKey, e.target.value)}
                            className="w-full text-sm border border-gray-300 bg-white rounded px-3 py-2.5 focus:ring-1 focus:ring-brand-accent focus:border-brand-accent outline-none font-bold"
                          >
                            <option value="">-- Seleccionar {attr.name} --</option>
                            {attr.values.map((val) => (
                              <option key={val.id} value={val.value}>
                                {val.value}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end pt-4 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-semibold text-brand-text uppercase mb-1">Precio Costo (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={manualCostPrice}
                    onKeyDown={handleNumericKeyDown}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val < 0) return;
                      setManualCostPrice(isNaN(val) ? 0 : val);
                    }}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2.5 focus:ring-1 focus:ring-brand-accent focus:border-brand-accent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-text uppercase mb-1">Precio Venta (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={manualPrice}
                    onKeyDown={handleNumericKeyDown}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val < 0) return;
                      setManualPrice(isNaN(val) ? 0 : val);
                    }}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2.5 focus:ring-1 focus:ring-brand-accent focus:border-brand-accent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-text uppercase mb-1">SKU Personalizado (Opcional)</label>
                  <input
                    type="text"
                    value={manualSku}
                    onChange={(e) => setManualSku(e.target.value)}
                    placeholder="Ej. SKU-CUSTOM-01"
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2.5 focus:ring-1 focus:ring-brand-accent focus:border-brand-accent outline-none uppercase"
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    disabled={loading || dbAttributes.length === 0}
                    className="w-full bg-brand-accent hover:opacity-90 text-white text-sm font-bold py-2.5 rounded-xl transition duration-200 disabled:opacity-50"
                  >
                    {loading ? 'Agregando...' : 'Agregar Variante Manualmente'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Table Section */}
      {loading && variants.length === 0 ? (
        <div className="text-center py-12 text-brand-text text-sm font-medium">Cargando variantes...</div>
      ) : variants.length > 0 ? (
        <div className="space-y-4">
          <div className="flex justify-end bg-gray-50 p-4 rounded-lg border border-gray-200">
             <div className="flex items-center gap-3">
               <label className="text-sm font-semibold text-brand-text">Descuento Masivo (%):</label>
               <input
                  type="number"
                  min="0"
                  max="100"
                  value={bulkDiscount}
                  onKeyDown={handleNumericKeyDown}
                  onChange={(e) => {
                    const val = e.target.value ? parseFloat(e.target.value) : '';
                    if (val !== '' && val < 0) return;
                    if (val !== '' && val > 100) return;
                    setBulkDiscount(val);
                  }}
                  placeholder="Ej: 20"
                  className="border border-gray-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-brand-accent outline-none w-24 text-sm"
               />
               <button
                  onClick={handleApplyBulkDiscount}
                  disabled={isApplyingBulkDiscount || bulkDiscount === ''}
                  className="bg-brand-accent hover:opacity-90 text-white text-sm font-semibold px-4 py-1.5 rounded transition disabled:opacity-50"
               >
                 {isApplyingBulkDiscount ? 'Aplicando...' : 'Aplicar a Todos'}
               </button>
             </div>
          </div>
          <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-brand-primary/20 text-brand-accent font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Atributos</th>
                <th className="px-6 py-3.5">SKU Auto-Generado</th>
                <th className="px-6 py-3.5">Descuento (%)</th>
                <th className="px-6 py-3.5">P. Costo (S/)</th>
                <th className="px-6 py-3.5">P. Venta (S/)</th>
                <th className="px-6 py-3.5">Margen</th>
                <th className="px-6 py-3.5 text-center">Estado</th>
                <th className="px-6 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-brand-text">
              {variants.map((v) => {
                const attrs = Object.entries(v.attributesJson)
                  .map(([k, val]) => `${k}: ${val}`)
                  .join(' | ');

                const isEditing = editingId === v.id;

                return (
                  <tr key={v.id} className="hover:bg-gray-50 transition duration-150">
                    <td className="px-6 py-4 font-medium text-gray-800">{attrs}</td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editSku}
                          onChange={(e) => setEditSku(e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-brand-accent outline-none text-xs w-48"
                        />
                      ) : (
                        v.sku
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editDiscount}
                          onKeyDown={handleNumericKeyDown}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (val < 0) return;
                            if (val > 100) return;
                            setEditDiscount(isNaN(val) ? 0 : val);
                          }}
                          className="border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-brand-accent outline-none text-xs w-20"
                        />
                      ) : (
                        v.discountPercent ? <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-xs">{v.discountPercent}%</span> : <span className="text-gray-400 text-xs">Sin desc.</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editCostPrice}
                          onKeyDown={handleNumericKeyDown}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (val < 0) return;
                            setEditCostPrice(isNaN(val) ? 0 : val);
                          }}
                          className="border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-brand-accent outline-none text-xs w-24"
                        />
                      ) : (
                        `S/ ${(v.costPrice ?? 0).toFixed(2)}`
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editPrice}
                          onKeyDown={handleNumericKeyDown}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (val < 0) return;
                            setEditPrice(isNaN(val) ? 0 : val);
                          }}
                          className="border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-brand-accent outline-none text-xs w-24"
                        />
                      ) : (
                        `S/ ${v.price.toFixed(2)}`
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const cost = isEditing ? editCostPrice : (v.costPrice ?? 0);
                        const price = isEditing ? editPrice : v.price;
                        const margin = price - cost;
                        const marginPct = price > 0 ? (margin / price) * 100 : 0;
                        return (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            margin < 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            S/ {margin.toFixed(2)} ({marginPct.toFixed(1)}%)
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleActive(v)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          v.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {v.isActive ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleSave(v.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 py-1 rounded transition"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="bg-gray-150 hover:bg-gray-250 text-gray-700 text-xs px-2.5 py-1 rounded transition"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(v)}
                          className="text-xs font-semibold text-brand-accent hover:text-black hover:underline"
                        >
                          Editar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white text-center py-16 rounded-lg border border-gray-200 text-gray-400">
          No hay variantes creadas para este producto. Rellena los campos de arriba para generar la matriz.
        </div>
      )}
        </>
      )}

      {/* Dynamic Images by Visual Driver Section */}
      {showImagesSection && (
        <div className={mode ? "w-full" : "mt-10 border-t border-gray-200 pt-8"}>
        <h3 className="text-xl font-semibold text-brand-accent flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-gray-500" />
          <span>Galería de Imágenes por Atributo Visual (Color)</span>
        </h3>
        <p className="text-sm text-brand-text mt-1">
          Sube imágenes específicas vinculadas a cada variante visual (como colores). Se mostrarán dinámicamente al seleccionar esa opción.
        </p>

        {visualDriverValues.length === 0 ? (
          <div className="bg-gray-50 text-center py-8 rounded-lg border border-gray-200 text-gray-400 mt-4 text-xs">
            No se han detectado variantes con atributos configurados como "Conductor Visual" (ej: Color) para este producto.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 mt-6">
            {visualDriverValues.map((val) => {
              const valImages = productImages.filter(img => img.attributeValueId === val.id);
              const isDragging = dragOverColorId === val.id;
              const isUploading = uploadingColorIds[val.id];
              return (
                <div key={val.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <span className="font-bold text-sm text-brand-accent uppercase tracking-wider">
                      {val.attributeName}: <span className="text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md text-xs normal-case">{val.value}</span>
                    </span>
                    <span className="text-xs text-gray-400">{valImages.length} imágenes</span>
                  </div>

                  {/* Thumbnail gallery */}
                  {(valImages.length > 0 || isUploading) && (
                    <div className="flex flex-wrap gap-3">
                      {valImages.map((img) => (
                        <div key={img.id} className="relative group border border-gray-200 rounded-lg overflow-hidden w-20 h-20 bg-gray-50 flex items-center justify-center p-1">
                          <img src={img.url} alt="" className="max-w-full max-h-full object-contain" />
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(img.id)}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white hover:text-red-400"
                            title="Eliminar imagen"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}

                      {isUploading && (
                        <div className="border border-gray-200 rounded-lg overflow-hidden w-20 h-20 bg-gray-50 flex flex-col items-center justify-center p-2 text-gray-400 animate-pulse">
                          <Loader2 size={16} className="animate-spin text-brand-accent" />
                          <span className="text-[9px] mt-1 font-bold">Subiendo...</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Drag and Drop Zone */}
                  <div
                    onDragOver={(e) => handleDragOver(e, val.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, val.id)}
                    onClick={() => {
                      const input = document.getElementById(`file-input-${val.id}`);
                      input?.click();
                    }}
                    className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                      isDragging
                        ? 'border-[#3F3F3F] bg-[#D9D9D2]/10 scale-[0.99]'
                        : 'border-gray-200 hover:bg-gray-50/55 hover:border-gray-300'
                    }`}
                  >
                    <Upload size={20} className={isDragging ? 'text-[#3F3F3F] animate-bounce' : 'text-gray-400'} />
                    <span className="text-xs font-bold text-[#3F3F3F]">
                      Arrastra imágenes o <span className="underline">selecciona archivos</span>
                    </span>
                    <span className="text-[10px] text-gray-400">JPEG, PNG o WEBP para {val.value}</span>
                    <input
                      type="file"
                      id={`file-input-${val.id}`}
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => handleUploadImages(val.id, e.target.files)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}
    </div>
  );
};
