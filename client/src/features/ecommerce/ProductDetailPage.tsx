import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '@/shared/api/axiosInstance';
import {
  Heart,
  Ruler,
  ArrowLeft,
  AlertTriangle,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { useCart } from './hooks/useCart';
import { RelatedProducts } from './components/RelatedProducts';

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

interface Category {
  id: number;
  name: string;
}

interface Brand {
  id: number;
  name: string;
}

interface ProductDetail {
  id: number;
  code: string;
  name: string;
  model: string | null;
  slug: string;
  description: string | null;
  categoryId: number;
  brandId: number;
  gender: string | { id: number; name: string } | null;
  category: Category;
  brand: Brand;
  images: ProductImage[];
  variants: Variant[];
  sizeGuideUrl: string | null;
}

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gallery Carousel State
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Selector State
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState<number>(1);
  const [attributes, setAttributes] = useState<any[]>([]);

  useEffect(() => {
    axiosInstance.get('/v1/ecommerce/attributes')
      .then(({ data }) => {
        if (data.success) setAttributes(data.data);
      })
      .catch(console.error);
  }, []);

  // Gallery Image Load State
  // Modal State
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useDocumentTitle(product ? product.name : 'Detalle de Producto');

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axiosInstance.get(`/v1/ecommerce/products/${slug}`);
      if (data.success && data.data) {
        const prod = data.data;
        // Find main image index or fallback
        const mainImgIndex = prod.images.findIndex((img: ProductImage) => img.isMain);
        const activeIdx = mainImgIndex >= 0 ? mainImgIndex : 0;
        setCurrentImageIndex(activeIdx);

        // Preload main image so it renders instantly when skeleton hides
        const mainImageUrl = prod.images[activeIdx]?.url;
        if (mainImageUrl) {
          const img = new window.Image();
          img.src = mainImageUrl;
          img.onload = () => {
            setProduct(prod);
            setLoading(false);
          };
          img.onerror = () => {
            setProduct(prod);
            setLoading(false);
          };
        } else {
          setProduct(prod);
          setLoading(false);
        }
      } else {
        setError('No se pudo cargar la información del producto.');
        setLoading(false);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Producto no encontrado.');
      } else {
        setError('Error de servidor al cargar el producto.');
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  // Reset image index when visual driver attribute changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedAttributes]);

  // Find visual driver (e.g. Color) selected value
  const visualDriverValueId = useMemo(() => {
    if (Object.keys(selectedAttributes).length === 0 || attributes.length === 0) return null;
    const visualAttr = attributes.find(a => a.name.toLowerCase() === 'color' || a.isVisualDriver);
    if (!visualAttr) return null;
    
    // Check if the visual attribute is present in the product's available attributes (case insensitive matching of key)
    const attrKey = Object.keys(selectedAttributes).find(k => k.toLowerCase() === visualAttr.name.toLowerCase());
    if (!attrKey) return null;

    const selectedVal = selectedAttributes[attrKey];
    const valObj = visualAttr.values.find((v: any) => v.value.toUpperCase() === selectedVal.toUpperCase());
    return valObj ? valObj.id : null;
  }, [selectedAttributes, attributes]);

  const filteredImages = useMemo(() => {
    if (!product) return [];
    if (!visualDriverValueId) return product.images;
    const colorImages = product.images.filter(img => (img as any).attributeValueId === visualDriverValueId);
    if (colorImages.length === 0) {
      return product.images.filter(img => !(img as any).attributeValueId);
    }
    return colorImages;
  }, [product, visualDriverValueId]);

  // Automatic Carousel effect
  useEffect(() => {
    if (!product || filteredImages.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % filteredImages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [product, filteredImages, isHovered]);

  // Extract dynamic attributes from all active variants
  const availableAttributes = useMemo(() => {
    if (!product) return {};
    const attrs: Record<string, Set<string>> = {};

    product.variants.forEach(variant => {
      if (variant.isActive) {
        Object.entries(variant.attributesJson).forEach(([key, value]) => {
          if (!attrs[key]) {
            attrs[key] = new Set<string>();
          }
          if (value) attrs[key].add(value as string);
        });
      }
    });

    const result: Record<string, string[]> = {};
    Object.keys(attrs).forEach(key => {
      result[key] = Array.from(attrs[key]);
    });
    return result;
  }, [product]);

  // Pre-select first available option for each attribute
  useEffect(() => {
    if (Object.keys(availableAttributes).length > 0) {
      const newSelections = { ...selectedAttributes };
      let changed = false;
      Object.entries(availableAttributes).forEach(([attrKey, values]) => {
        if (!newSelections[attrKey] && values.length > 0) {
          newSelections[attrKey] = values[0];
          changed = true;
        }
      });
      if (changed) {
        setSelectedAttributes(newSelections);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableAttributes]);

  // Determine current active variant based on dynamic selections
  const selectedVariant = useMemo(() => {
    if (!product || Object.keys(selectedAttributes).length === 0) return null;
    
    return product.variants.find(variant => {
      if (!variant.isActive) return false;
      return Object.entries(selectedAttributes).every(([key, value]) => {
        return variant.attributesJson[key]?.toUpperCase() === value.toUpperCase();
      });
    }) || null;
  }, [product, selectedAttributes]);

  // Helper for multi-dimensional stock validation and existence
  const checkOptionStatus = (attrKey: string, optionValue: string) => {
    if (!product) return { existsInCurrent: false, outOfStock: true };
    
    const testSelection = { ...selectedAttributes, [attrKey]: optionValue };
    
    const matchingVariants = product.variants.filter(v => {
      if (!v.isActive) return false;
      return Object.entries(testSelection).every(([k, vVal]) => {
        return v.attributesJson[k]?.toUpperCase() === vVal.toUpperCase();
      });
    });

    return {
      existsInCurrent: matchingVariants.length > 0,
      outOfStock: matchingVariants.length > 0 && matchingVariants.every(v => v.outOfStock)
    };
  };

  const handleSelection = (attrKey: string, val: string) => {
    if (!product) return;
    const newSelections = { ...selectedAttributes, [attrKey]: val };
    
    // Check if this exact combination exists
    const combinationExists = product.variants.some(v => 
      v.isActive && Object.entries(newSelections).every(([k, vVal]) => v.attributesJson[k]?.toUpperCase() === vVal.toUpperCase())
    );

    if (!combinationExists) {
      // Find the first available variant that has the newly selected option
      const fallbackVariant = product.variants.find(v => 
        v.isActive && v.attributesJson[attrKey]?.toUpperCase() === val.toUpperCase()
      );
      if (fallbackVariant) {
        setSelectedAttributes(fallbackVariant.attributesJson as Record<string, string>);
      } else {
        setSelectedAttributes(newSelections); // Should not happen
      }
    } else {
      setSelectedAttributes(newSelections);
    }
    setQuantity(1);
  };

  // Base price representation & selected image calculations
  const basePrice = product ? (selectedVariant ? selectedVariant.price : (product.variants[0]?.price || 0)) : 0;
  const discountPercent = product ? (selectedVariant ? (selectedVariant.discountPercent || 0) : (product.variants[0]?.discountPercent || 0)) : 0;
  const finalPrice = discountPercent > 0 ? basePrice * (1 - discountPercent / 100) : basePrice;
  
  const selectedImage = filteredImages[currentImageIndex] ? filteredImages[currentImageIndex].url : 'https://via.placeholder.com/600x600?text=No+Image';

  // Handle wishlist toggle
  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast.success(!isWishlisted ? 'Agregado a favoritos' : 'Eliminado de favoritos');
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      toast.error('Por favor completa la selección de opciones.');
      return;
    }
    if (selectedVariant.outOfStock) {
      toast.error('Esta variante no tiene stock disponible.');
      return;
    }

    try {
      await addItem(selectedVariant.id, quantity);
      const selectedOpts = Object.values(selectedAttributes).join(' / ');
      toast.success(`¡Agregado al carrito! ${product?.name} (${selectedOpts}) x${quantity}`);
    } catch (error) {
      toast.error('Error al agregar al carrito');
    }
  };

  const handleBuyNow = async () => {
    if (!selectedVariant) {
      toast.error('Por favor completa la selección de opciones.');
      return;
    }
    if (selectedVariant.outOfStock) {
      toast.error('Esta variante no tiene stock disponible.');
      return;
    }
    try {
      await addItem(selectedVariant.id, quantity);
      toast.success('¡Producto seleccionado! Redirigiendo...');
      navigate('/checkout');
    } catch (error) {
      toast.error('Error al procesar la compra');
    }
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (filteredImages.length === 0) return;
    setCurrentImageIndex((prev) => (prev - 1 + filteredImages.length) % filteredImages.length);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (filteredImages.length === 0) return;
    setCurrentImageIndex((prev) => (prev + 1) % filteredImages.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50/50 text-neutral-800 pb-10 relative overflow-hidden font-sans">
        {/* Top Navigation Row Skeleton */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-3 pb-1 relative z-20">
          <div className="flex items-center justify-between gap-4">
            <div className="w-10 h-10 rounded-full bg-neutral-200 animate-pulse border border-neutral-100" />
            <div className="h-3 w-48 bg-neutral-200 animate-pulse rounded-md hidden sm:block" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-8 relative z-10 flex flex-col justify-between min-h-[78vh]">
          {/* Hero Section Skeleton */}
          <div className="relative flex-1 flex flex-col justify-center items-center py-2 md:py-4 my-auto lg:-mt-6">
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-center z-10">

              {/* Carousel skeleton */}
              <div className="lg:col-span-8 flex items-center justify-center relative h-[280px] md:h-[350px] lg:h-[430px] w-full bg-neutral-200/40 rounded-2xl animate-pulse" />

              {/* Sidebar skeleton */}
              <div className="lg:col-span-4 space-y-5 lg:pl-6 flex flex-col justify-center bg-white/60 p-5 rounded-2xl border border-neutral-200/50 shadow-xs z-20 animate-pulse">
                <div className="space-y-2">
                  <div className="h-3 w-16 bg-neutral-200 rounded-full" />
                  <div className="h-6 w-3/4 bg-neutral-200 rounded-md" />
                  <div className="h-2.5 w-24 bg-neutral-200 rounded-md" />
                </div>

                <div className="py-3 border-y border-neutral-100 flex items-center justify-between">
                  <div className="h-5 w-20 bg-neutral-200 rounded-md" />
                  <div className="h-3.5 w-12 bg-neutral-200 rounded-md" />
                </div>

                {/* Attributes skeleton */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="h-2.5 w-28 bg-neutral-200 rounded-md" />
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-neutral-200" />
                      <div className="w-8 h-8 rounded-full bg-neutral-200" />
                      <div className="w-8 h-8 rounded-full bg-neutral-200" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2.5 w-24 bg-neutral-200 rounded-md" />
                    <div className="flex gap-2">
                      <div className="w-10 h-9 bg-neutral-200 rounded-lg" />
                      <div className="w-10 h-9 bg-neutral-200 rounded-lg" />
                      <div className="w-10 h-9 bg-neutral-200 rounded-lg" />
                    </div>
                  </div>
                </div>

                {/* Action buttons skeleton */}
                <div className="space-y-2 pt-2 border-t border-neutral-100">
                  <div className="w-full h-10 bg-neutral-200 rounded-lg" />
                  <div className="flex gap-2">
                    <div className="flex-1 h-9 bg-neutral-200 rounded-lg" />
                    <div className="w-12 h-9 bg-neutral-200 rounded-lg" />
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Description skeleton */}
          <div className="mt-4 pt-4 border-t border-neutral-200 shrink-0 max-w-3xl animate-pulse">
            <div className="h-3 w-16 bg-neutral-200 rounded-md mb-2" />
            <div className="space-y-1.5">
              <div className="h-2.5 w-full bg-neutral-200 rounded-md" />
              <div className="h-2.5 w-5/6 bg-neutral-200 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-gray-800">{error || 'Producto no encontrado'}</h2>
        <button
          onClick={() => navigate('/catalog')}
          className="inline-flex items-center gap-2 bg-[#3F3F3F] text-white font-bold px-6 py-2.5 rounded-xl hover:bg-[#3F3F3F]/90 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Volver al catálogo</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text pb-10 animate-in fade-in duration-300 relative font-sans">
      {/* Decorative Lines from the reference design */}
      <div className="absolute inset-0 pointer-events-none opacity-20 select-none">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 0,20 C 30,10 70,30 100,20 M 0,80 C 30,90 70,70 100,80" stroke="var(--color-brand-primary)" strokeWidth="0.2" fill="none" />
        </svg>
      </div>

      {/* Huge Background Watermark with Gradient at the body/root level */}
      <div className="absolute left-1/2 -translate-x-1/2 top-[10vh] lg:top-[5vh] flex items-center justify-center select-none pointer-events-none z-0 overflow-hidden w-screen">
        <h1 className="max-w-[90vw] lg:max-w-[95vw] text-[12vw] lg:text-[210px] font-black uppercase tracking-tighter leading-none select-none text-center whitespace-normal break-words bg-gradient-to-r from-brand-primary/60 via-brand-accent/30 to-brand-primary/50 bg-clip-text text-transparent opacity-35">
          {product.model || ''}
        </h1>
      </div>

      {/* Top Navigation Row (Outside the main hero viewport container, closer to header) */}
      <div className="max-w-7xl mx-auto lg:px-8 pt-3 pb-1 relative z-20">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/90 hover:bg-white text-brand-accent shadow-sm flex items-center justify-center transition-all hover:scale-105 active:scale-95 border border-neutral-100"
            title="Regresar"
          >
            <ArrowLeft size={18} />
          </button>

          <nav className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-brand-text/60 uppercase tracking-widest">
            <button onClick={() => navigate('/')} className="hover:text-brand-accent transition-colors">Inicio</button>
            <ChevronRight size={10} />
            <button onClick={() => navigate(`/catalog?categoryId=${product.category.id}`)} className="hover:text-brand-accent transition-colors">{product.category.name}</button>
            <ChevronRight size={10} />
            <span className="text-brand-accent font-black truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto lg:px-8 pb-8 relative z-10 flex flex-col justify-between min-h-[78vh]">
        {/* Hero Section: Centered Floating Image Carousel + Huge Background Text + Side Info */}
        <div className="relative flex-1 flex flex-col justify-center items-center py-2 md:py-4 my-auto lg:-mt-6">
          {/* Core Content Grid */}
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 lg:gap-6 gap-0 items-center z-10">

            {/* Interactive Image Carousel Container (Takes 8 Columns) */}
            <div
              className="lg:col-span-8 flex items-center justify-center relative h-[280px] md:h-[350px] lg:h-[430px] w-full group overflow-hidden"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {/* Previous Slide Button */}
              {filteredImages.length > 1 && (
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-4 z-20 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-brand-accent flex items-center justify-center transition-all hover:scale-105 active:scale-95 border border-neutral-100 opacity-0 group-hover:opacity-100 shadow-sm"
                  title="Anterior"
                >
                  <ChevronLeft size={18} />
                </button>
              )}

              {/* Next Slide Button */}
              {filteredImages.length > 1 && (
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-4 z-20 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-brand-accent flex items-center justify-center transition-all hover:scale-105 active:scale-95 border border-neutral-100 opacity-0 group-hover:opacity-100 shadow-sm"
                  title="Siguiente"
                >
                  <ChevronRight size={18} />
                </button>
              )}

              {/* Main Active Product Image */}
              <div className="relative w-full h-full flex items-center justify-center p-4">
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="max-w-full max-h-full object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.12)] hover:rotate-3 transition-transform duration-500 hover:scale-105 select-none"
                />

                {selectedVariant && selectedVariant.outOfStock && (
                  <div className="absolute top-2 left-2 bg-red-600 text-white font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                    Sin Stock
                  </div>
                )}
              </div>

              {/* Slide Position Indicator Dots */}
              {filteredImages.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-neutral-900/10 py-1.5 px-3 rounded-full backdrop-blur-xs">
                  {filteredImages.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentImageIndex ? 'w-4 bg-brand-accent' : 'w-1.5 bg-neutral-300 hover:bg-neutral-400'}`}
                      title={`Ver imagen ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right Meta Info & Checkout Panel (Takes 4 Columns) */}
            <div className="lg:col-span-4 space-y-4 lg:pl-6 flex flex-col justify-center bg-white/30 p-5 rounded-2xl border border-white/45 shadow-xs z-20">
              <div>
                <span className="text-[9px] font-black text-brand-accent bg-brand-primary/55 px-3 py-1 rounded-full uppercase tracking-widest inline-block mb-1.5">
                  {product.brand.name}
                </span>
                <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight leading-none block">
                  {product.name}
                </h1>
                <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block mt-0.5">
                  CÓDIGO: {product.code}
                </span>
              </div>

              {/* Price & Category */}
              <div className="py-2 border-y border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-brand-accent">
                    S/ {finalPrice.toFixed(2)}
                  </span>
                  {discountPercent > 0 && (
                    <>
                      <span className="text-sm font-bold text-neutral-400 line-through">
                        S/ {Number(basePrice).toFixed(2)}
                      </span>
                      <span className="text-[10px] font-black text-white bg-red-600 px-2 py-0.5 rounded-sm uppercase tracking-wider">
                        -{discountPercent}%
                      </span>
                    </>
                  )}
                </div>
                <span className="text-[9px] font-bold text-neutral-400 uppercase bg-neutral-100 px-2 py-0.5 rounded-sm">
                  {product.category.name}
                </span>
              </div>

              {/* Dynamic Attributes Render */}
              <div className="space-y-4">
                {Object.entries(availableAttributes).map(([attrKey, values]) => {
                  const isVisualDriver = attrKey.toLowerCase() === 'color' || attributes.find(a => a.name.toLowerCase() === attrKey.toLowerCase())?.isVisualDriver;
                  const selectedVal = selectedAttributes[attrKey];

                  return (
                    <div key={attrKey} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest block">
                          Seleccionar {attrKey} {selectedVal ? `: ${selectedVal}` : ''}
                        </span>
                        {/* Only show size guide if it's a 'talla' or 'size' attribute */}
                        {(attrKey.toLowerCase() === 'talla' || attrKey.toLowerCase() === 'size') && product.sizeGuideUrl && (
                          <button
                            onClick={() => setShowSizeGuide(true)}
                            className="inline-flex items-center gap-1.5 text-[9px] font-bold text-slate-400 hover:text-brand-accent transition-colors underline underline-offset-4"
                          >
                            <Ruler size={10} />
                            <span>Guía</span>
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {values.map(val => {
                          const { existsInCurrent, outOfStock } = checkOptionStatus(attrKey, val);
                          const isSelected = selectedVal === val;
                          
                          // If it doesn't exist in current selection, we show it visually muted
                          const isUnavailable = !existsInCurrent;

                          if (isVisualDriver) {
                            // Find corresponding image or hex
                            const colorAttr = attributes.find(a => a.name.toLowerCase() === attrKey.toLowerCase() || a.isVisualDriver);
                            const valObj = colorAttr?.values.find((v: any) => v.value.toUpperCase() === val.toUpperCase());
                            const valId = valObj ? valObj.id : null;
                            
                            const colorImg = valId ? product.images.find(img => (img as any).attributeValueId === valId) : null;
                            const mainParentImg = product.images.find(img => !(img as any).attributeValueId) || product.images[0];
                            const thumbUrl = colorImg?.url || mainParentImg?.url;
                            
                            const COLOR_MAP: Record<string, string> = {
                              'NEGRO': '#000000', 'BLANCO': '#FFFFFF', 'ROJO': '#FF0000', 'AZUL': '#0000FF',
                              'VERDE': '#00FF00', 'AMARILLO': '#FFFF00', 'GRIS': '#808080', 'BEIGE': '#F5F5DC',
                              'MARRON': '#8B4513', 'ROSA': '#FFC0CB', 'MORADO': '#800080', 'NARANJA': '#FFA500'
                            };
                            const hex = COLOR_MAP[val.toUpperCase()] || '#E2E8F0';

                            return (
                              <button
                                key={val}
                                onClick={() => handleSelection(attrKey, val)}
                                className={`w-10 h-10 rounded-full transition-all flex items-center justify-center cursor-pointer relative group overflow-hidden border
                                  ${isSelected
                                    ? 'ring-2 ring-brand-accent ring-offset-2 scale-110 border-transparent'
                                    : 'border-slate-200 hover:scale-105'}
                                  ${isUnavailable ? 'opacity-30' : ''}
                                  ${outOfStock ? 'opacity-50 grayscale' : ''}`}
                                title={isUnavailable ? `${val} (No disponible con selección actual)` : val}
                              >
                                {thumbUrl ? (
                                  <img src={thumbUrl} alt={val} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full" style={{ backgroundColor: hex }} />
                                )}
                                {(outOfStock || isUnavailable) && (
                                  <div className="absolute inset-0 flex items-center justify-center z-10">
                                    <div className="w-full h-[2px] bg-red-500/80 -rotate-45"></div>
                                  </div>
                                )}
                                <div className="absolute inset-0 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)]"></div>
                              </button>
                            );
                          } else {
                            // Standard button for Size/Material/Capacity
                            return (
                              <button
                                key={val}
                                onClick={() => handleSelection(attrKey, val)}
                                className={`min-w-[2.5rem] h-9 px-3 text-[10px] font-bold rounded-lg border transition-all flex items-center justify-center cursor-pointer relative overflow-hidden
                                  ${isSelected
                                    ? 'border-brand-accent bg-brand-accent text-white shadow-sm'
                                    : 'border-neutral-200 bg-white text-neutral-700'}
                                  ${isUnavailable ? 'opacity-40 bg-neutral-50 text-neutral-400 border-neutral-100 hover:border-neutral-300' : ''}
                                  ${outOfStock && !isUnavailable ? 'opacity-60 text-neutral-500 bg-neutral-100 hover:bg-neutral-200 hover:border-neutral-300' : 'hover:border-brand-accent'}`}
                                title={isUnavailable ? `${val} (No disponible con selección actual)` : val}
                              >
                                <span className={(outOfStock || isUnavailable) ? 'line-through decoration-neutral-400/60 decoration-2' : ''}>
                                  {val}
                                </span>
                              </button>
                            );
                          }
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quantity Selector & Availability Message */}
              <div className="pt-2">
                {selectedVariant && selectedVariant.outOfStock ? (
                  <div className="flex items-center gap-2 text-red-500 bg-red-50 px-3 py-2 rounded-lg border border-red-100 mb-2">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Agotado en esta combinación</span>
                  </div>
                ) : (
                  selectedVariant && (
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-brand-text uppercase tracking-widest">Cantidad:</span>
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
                        <button
                          disabled={quantity <= 1}
                          onClick={() => setQuantity(q => q - 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-slate-50 text-slate-500 disabled:opacity-30 font-bold text-xs"
                        >
                          -
                        </button>
                        <span className="w-7 text-center text-[11px] font-black text-slate-800">{quantity}</span>
                        <button
                          disabled={quantity >= selectedVariant.stock}
                          onClick={() => setQuantity(q => q + 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-slate-50 text-slate-500 disabled:opacity-30 font-bold text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Checkout Action Buttons */}
              <div className="flex flex-col gap-2 pt-2 border-t border-neutral-100">
                <button
                  onClick={handleAddToCart}
                  disabled={!selectedVariant || selectedVariant.outOfStock}
                  className={`w-full font-bold py-2.5 px-4 rounded-lg transition-all cursor-pointer text-[10px] tracking-widest uppercase border border-transparent shadow-sm
                    ${!selectedVariant
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : selectedVariant.outOfStock
                        ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed border-neutral-300'
                        : 'bg-brand-accent text-brand-bg hover:opacity-90'}`}
                >
                  {selectedVariant && selectedVariant.outOfStock ? 'AGOTADO' : 'Añadir al Carrito'}
                </button>

                <div className="flex gap-2 w-full">
                  <button
                    onClick={handleBuyNow}
                    disabled={!selectedVariant || selectedVariant.outOfStock}
                    className={`flex-1 font-bold py-2.5 px-4 rounded-lg transition-all cursor-pointer text-[10px] tracking-widest uppercase border border-brand-accent text-brand-accent bg-transparent hover:bg-brand-accent hover:text-white
                      ${(!selectedVariant || selectedVariant.outOfStock) ? 'hidden' : ''}`}
                  >
                    Comprar Ahora
                  </button>

                  <button
                    onClick={toggleWishlist}
                    className={`w-12 h-[38px] flex items-center justify-center rounded-lg border transition-all cursor-pointer shadow-xs
                      ${isWishlisted
                        ? 'bg-red-50 border-red-200 text-red-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-400'} ${(!selectedVariant || selectedVariant.outOfStock) ? 'w-full' : ''}`}
                  >
                    <Heart size={15} fill={isWishlisted ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Panel: Description (Footer) */}
        {product.description && (
          <div className="mt-4 pt-4 border-t border-brand-primary/20 shrink-0 max-w-3xl">
            <span className="text-[10px] font-black text-brand-text uppercase tracking-widest block mb-1">
              Inspiración :
            </span>
            <p className="text-[11px] text-brand-text/80 leading-relaxed font-medium">
              {product.description}
            </p>
          </div>
        )}
      </div>

      {/* Related Products — HU-093 */}
      {product && (
        <div className="mt-8 pt-8 border-t border-brand-primary/20">
          <RelatedProducts productId={product.id} />
        </div>
      )}

      {/* Size Guide Modal Overlay */}
      {showSizeGuide && product.sizeGuideUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#1e1e1a]/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowSizeGuide(false)}
          />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl border border-[#D9D9D2]/30 space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#D9D9D2]/40 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Ruler className="text-[#8B6E4E]" size={20} />
                <h3 className="text-lg font-bold text-[#3F3F3F]">Guía de Tallas</h3>
              </div>
              <button
                onClick={() => setShowSizeGuide(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors text-sm font-bold p-1 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center p-2 bg-[#F7F7F5] rounded-2xl border border-[#D9D9D2]/20">
              <img
                src={product.sizeGuideUrl}
                alt="Medidas y Guía de Tallas"
                className="max-w-full max-h-[60vh] object-contain rounded-lg"
              />
            </div>

            <div className="pt-2 text-center text-xs text-gray-400 shrink-0">
              * Las medidas pueden variar ligeramente dependiendo del corte de la prenda.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
