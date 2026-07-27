import React, { useState, useEffect, useMemo } from 'react';
import { X, Minus, Plus, ShoppingCart } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axiosInstance from '@/shared/api/axiosInstance';
import { useCart } from '../hooks/useCart';

interface VariantSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  productSlug: string;
  // If provided, we are editing an existing cart item
  editCartItemId?: number;
  initialQuantity?: number;
}

interface ProductImage {
  id: number;
  url: string;
  isMain: boolean;
}

interface Variant {
  id: number;
  sku: string;
  price: number;
  attributesJson: Record<string, string>;
  isActive: boolean;
  stock: number;
  outOfStock: boolean;
  discountPercent?: number;
}

interface ProductDetail {
  id: number;
  name: string;
  slug: string;
  images: ProductImage[];
  variants: Variant[];
}

export const VariantSelectionModal: React.FC<VariantSelectionModalProps> = ({
  isOpen,
  onClose,
  productSlug,
  editCartItemId,
  initialQuantity = 1,
}) => {
  const { addItem, updateItem, removeItem, cart } = useCart();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedTalla, setSelectedTalla] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(initialQuantity);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && productSlug) {
      setLoading(true);
      axiosInstance.get(`/v1/ecommerce/products/${productSlug}`)
        .then(response => {
          if (response.data?.success) {
            setProduct(response.data.data);
          }
        })
        .catch(error => {
          console.error('Error fetching product for modal:', error);
          toast.error('No se pudo cargar el producto');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, productSlug]);

  // Si estamos editando, intentar preseleccionar atributos
  useEffect(() => {
    if (product && editCartItemId && cart) {
      const itemToEdit = cart.items.find(i => i.id === editCartItemId);
      if (itemToEdit) {
        setSelectedTalla(itemToEdit.variant.attributesJson?.talla || '');
        setSelectedColor(itemToEdit.variant.attributesJson?.color || '');
        setQuantity(itemToEdit.quantity);
      }
    }
  }, [product, editCartItemId, cart]);

  const { tallas, colores } = useMemo(() => {
    if (!product) return { tallas: [], colores: [] };
    const tallasSet = new Set<string>();
    const coloresSet = new Set<string>();

    product.variants.forEach(variant => {
      if (variant.isActive) {
        if (variant.attributesJson?.talla) tallasSet.add(variant.attributesJson.talla);
        if (variant.attributesJson?.color) coloresSet.add(variant.attributesJson.color);
      }
    });

    return {
      tallas: Array.from(tallasSet),
      colores: Array.from(coloresSet)
    };
  }, [product]);

  useEffect(() => {
    if (colores.length > 0 && !selectedColor) {
      setSelectedColor(colores[0]);
    }
    if (tallas.length > 0 && !selectedTalla) {
      setSelectedTalla(tallas[0]);
    }
  }, [colores, tallas, selectedColor, selectedTalla]);

  const selectedVariant = useMemo(() => {
    if (!product || !selectedTalla || !selectedColor) return null;
    return product.variants.find(variant => 
      variant.isActive &&
      variant.attributesJson?.talla?.toUpperCase() === selectedTalla.toUpperCase() &&
      variant.attributesJson?.color?.toUpperCase() === selectedColor.toUpperCase()
    ) || null;
  }, [product, selectedTalla, selectedColor]);

  const mainImage = product?.images?.find(img => img.isMain)?.url || product?.images?.[0]?.url || 'https://via.placeholder.com/150';

  const handleConfirm = async () => {
    if (!selectedVariant) {
      toast.error('Por favor selecciona talla y color.');
      return;
    }
    if (selectedVariant.outOfStock) {
      toast.error('Esta variante no tiene stock disponible.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editCartItemId) {
        const itemToEdit = cart?.items.find(i => i.id === editCartItemId);
        if (itemToEdit?.variantId === selectedVariant.id) {
          // Solo cambió la cantidad
          await updateItem(editCartItemId, quantity);
        } else {
          // Cambió la variante (se borra el viejo y se agrega el nuevo)
          await removeItem(editCartItemId);
          await addItem(selectedVariant.id, quantity);
        }
        toast.success(`Carrito actualizado correctamente`);
      } else {
        await addItem(selectedVariant.id, quantity);
        toast.success(`¡Agregado al carrito! ${product?.name}`);
      }
      onClose();
    } catch (error) {
      toast.error('Error al procesar la solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };

  const basePrice = selectedVariant ? selectedVariant.price : (product?.variants[0]?.price || 0);
  const discountPercent = selectedVariant ? (selectedVariant.discountPercent || 0) : (product?.variants[0]?.discountPercent || 0);
  const finalPrice = discountPercent > 0 ? basePrice * (1 - discountPercent / 100) : basePrice;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in relative flex flex-col max-h-[90vh]">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
          </div>
        ) : product ? (
          <div className="flex flex-col h-full overflow-hidden w-full">
            <div className="p-4 border-b flex items-start justify-between shrink-0">
              <div className="flex gap-4 items-center">
                <img src={mainImage} alt={product.name} className="w-16 h-16 object-contain rounded-md bg-gray-50 border shrink-0" />
                <div>
                  <h3 className="font-bold text-lg text-brand-accent line-clamp-1">{product.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xl font-black text-brand-accent">
                      S/ {Number(finalPrice).toFixed(2)}
                    </p>
                    {discountPercent > 0 && (
                      <>
                        <p className="text-sm font-bold text-gray-400 line-through">
                          S/ {Number(basePrice).toFixed(2)}
                        </p>
                        <span className="text-[10px] font-black text-white bg-red-600 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                          -{discountPercent}%
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-1 text-gray-400 hover:text-black rounded-full hover:bg-gray-100 transition shrink-0">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Tallas */}
              {tallas.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Talla</h4>
                  <div className="flex flex-wrap gap-2">
                    {tallas.map(talla => (
                      <button
                        key={talla}
                        onClick={() => setSelectedTalla(talla)}
                        className={`min-w-[3rem] h-12 px-3 rounded-xl flex items-center justify-center font-medium transition-all ${
                          selectedTalla === talla
                            ? 'bg-brand-accent text-white shadow-md'
                            : 'bg-white border-2 border-gray-100 text-gray-600 hover:border-brand-primary hover:bg-gray-50'
                        }`}
                      >
                        {talla}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Colores */}
              {colores.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Color</h4>
                  <div className="flex flex-wrap gap-2">
                    {colores.map(color => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 h-12 rounded-xl flex items-center justify-center font-medium transition-all ${
                          selectedColor === color
                            ? 'bg-brand-accent text-white shadow-md'
                            : 'bg-white border-2 border-gray-100 text-gray-600 hover:border-brand-primary hover:bg-gray-50'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Cantidad */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Cantidad</h4>
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl p-1">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-black hover:bg-white rounded-lg transition-all disabled:opacity-50"
                    >
                      <Minus size={18} />
                    </button>
                    <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
                    <button
                      onClick={() => setQuantity(q => q + 1)}
                      className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-black hover:bg-white rounded-lg transition-all"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  {selectedVariant && (
                    <span className="text-sm text-gray-500">
                      {selectedVariant.outOfStock ? (
                        <span className="text-red-500 font-medium">Agotado</span>
                      ) : (
                        `${selectedVariant.stock} disponibles`
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 shrink-0">
              <button
                onClick={handleConfirm}
                disabled={!selectedVariant || isSubmitting || selectedVariant.outOfStock}
                className={`w-full py-4 rounded-xl flex justify-center items-center gap-2 font-bold transition-all ${
                  !selectedVariant || isSubmitting || selectedVariant.outOfStock
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-brand-accent text-white hover:bg-black shadow-lg hover:shadow-xl'
                }`}
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <ShoppingCart size={20} />
                    {editCartItemId ? 'Actualizar Carrito' : 'Agregar al Carrito'}
                  </span>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-red-500">Error al cargar el producto.</div>
        )}
      </div>
    </div>
  );
};
