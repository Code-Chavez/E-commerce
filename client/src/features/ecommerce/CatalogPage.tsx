import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { ProductFilters } from './components/ProductFilters';
import { searchProducts, getCategories } from './services/search.service';
import type { SearchProductItem, Category } from './types/search.types';
import { toast } from 'react-hot-toast';
import { Loader2, Grid3X3, ArrowUpDown, Search } from 'lucide-react';
import ProductCard from './components/ProductCard';

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<SearchProductItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaginationLoading, setIsPaginationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract query parameters from URL
  const q = searchParams.get('q') || '';
  const categoryId = searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : undefined;
  const brandId = searchParams.get('brandId') ? Number(searchParams.get('brandId')) : undefined;
  const genderId = searchParams.get('genderId') ? Number(searchParams.get('genderId')) : undefined;
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const branchId = searchParams.get('branchId') ? Number(searchParams.get('branchId')) : undefined;
  const orderBy = (searchParams.get('orderBy') as 'relevance' | 'newest' | 'price_asc' | 'price_desc') || 'relevance';

  // Extract dynamic attributes from query parameters (attr_X=Y)
  const attributes: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    if (key.startsWith('attr_')) {
      const attrId = key.substring(5);
      if (attrId) {
        attributes[attrId] = value;
      }
    }
  });

  const stringifiedAttributes = JSON.stringify(attributes);

  // Set document title
  useDocumentTitle(q ? `Buscar: ${q}` : 'Catálogo de Prendas - D\'Mendoza');

  // Trigger search when searchParams change
  useEffect(() => {
    const fetchInitialResults = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await searchProducts({
          q,
          categoryId,
          brandId,
          genderId,
          minPrice,
          maxPrice,
          branchId,
          orderBy,
          limit: 8,
          ...attributes, // Send dynamic attributes directly in the query object
        });
        if (response.success) {
          setProducts(response.data);
          setNextCursor(response.pagination.nextCursor || null);
        }
      } catch (err) {
        console.error('Error fetching search results:', err);
        setError('No pudimos cargar los resultados de búsqueda. Inténtalo más tarde.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialResults();
  }, [q, categoryId, brandId, genderId, minPrice, maxPrice, branchId, orderBy, stringifiedAttributes]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategoriesData = async () => {
      try {
        const response = await getCategories();
        if (response.success) {
          setCategories(response.data);
        }
      } catch (err) {
        console.error('Error fetching categories in CatalogPage:', err);
      }
    };
    fetchCategoriesData();
  }, []);

  // Load more pages (pagination)
  const handleLoadMore = async () => {
    if (!nextCursor || isPaginationLoading) return;
    setIsPaginationLoading(true);
    try {
      const response = await searchProducts({
        q,
        categoryId,
        brandId,
        genderId,
        minPrice,
        maxPrice,
        branchId,
        orderBy,
        cursor: Number(nextCursor),
        limit: 8,
      });
      if (response.success) {
        setProducts((prev) => [...prev, ...response.data]);
        setNextCursor(response.pagination.nextCursor || null);
      }
    } catch (err) {
      console.error('Error paginating search results:', err);
      toast.error('Error al cargar más productos');
    } finally {
      setIsPaginationLoading(false);
    }
  };

  // Sync state modifications to SearchParams
  const updateFilters = (newFilters: {
    categoryId?: number;
    brandId?: number;
    genderId?: number;
    minPrice?: number;
    maxPrice?: number;
    branchId?: number;
    attributes?: Record<string, string>;
  }) => {
    const nextParams = new URLSearchParams();
    if (q) nextParams.set('q', q);
    if (newFilters.categoryId !== undefined) nextParams.set('categoryId', newFilters.categoryId.toString());
    if (newFilters.brandId !== undefined) nextParams.set('brandId', newFilters.brandId.toString());
    if (newFilters.genderId !== undefined) nextParams.set('genderId', newFilters.genderId.toString());
    if (newFilters.minPrice !== undefined) nextParams.set('minPrice', newFilters.minPrice.toString());
    if (newFilters.maxPrice !== undefined) nextParams.set('maxPrice', newFilters.maxPrice.toString());
    if (newFilters.branchId !== undefined) nextParams.set('branchId', newFilters.branchId.toString());
    
    if (newFilters.attributes) {
      Object.entries(newFilters.attributes).forEach(([attrId, valId]) => {
        nextParams.set(`attr_${attrId}`, valId);
      });
    }

    nextParams.set('orderBy', orderBy);
    setSearchParams(nextParams);
  };

  const handleOrderByChange = (newOrder: 'relevance' | 'newest' | 'price_asc' | 'price_desc') => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('orderBy', newOrder);
    setSearchParams(nextParams);
  };

  const handleClearFilters = () => {
    setLocalSearch('');
    const nextParams = new URLSearchParams();
    nextParams.set('orderBy', 'relevance');
    setSearchParams(nextParams);
  };

  // Local state for inline search input
  const [localSearch, setLocalSearch] = useState(q);
  useEffect(() => {
    setLocalSearch(q);
  }, [q]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextParams = new URLSearchParams(searchParams);
    if (localSearch.trim()) {
      nextParams.set('q', localSearch.trim());
    } else {
      nextParams.delete('q');
    }
    setSearchParams(nextParams);
  };


  const handleCategoryPillClick = (catId?: number) => {
    const nextParams = new URLSearchParams(searchParams);
    if (catId !== undefined) {
      nextParams.set('categoryId', catId.toString());
    } else {
      nextParams.delete('categoryId');
    }
    setSearchParams(nextParams);
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Top Banner Context */}
      <div className="pt-12 pb-8 max-w-[1280px] mx-auto px-4">
        <div className="flex flex-col gap-6 border-b border-neutral-100 pb-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Colección</span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight mt-1 uppercase">
                {q ? `Resultados: "${q}"` : 'Todos los productos'}
              </h1>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
              <span className="text-neutral-400 text-xs font-medium">
                {isLoading ? 'Cargando...' : `${products.length} artículos`}
              </span>
              
              {/* Sort Selection */}
              <div className="flex items-center gap-1.5 border-b border-neutral-200 pb-1 hover:border-neutral-800 transition-colors">
                <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                <select
                  value={orderBy}
                  onChange={(e) => handleOrderByChange(e.target.value as any)}
                  className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 bg-transparent border-none outline-none p-0 pr-6 focus:ring-0 cursor-pointer select-none"
                  style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
                >
                  <option value="relevance">Relevancia</option>
                  <option value="newest">Lo más nuevo</option>
                  <option value="price_asc">Menor Precio</option>
                  <option value="price_desc">Mayor Precio</option>
                </select>
              </div>
            </div>
          </div>

          {/* Inline Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative max-w-md w-full">
            <input
              type="text"
              placeholder="Buscar prendas en el catálogo..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full bg-neutral-50 text-xs font-bold text-neutral-800 rounded-full py-3 pl-10 pr-10 border border-neutral-200 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/20 transition-all placeholder-neutral-400"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            {localSearch && (
              <button
                type="button"
                onClick={() => {
                  setLocalSearch('');
                  const nextParams = new URLSearchParams(searchParams);
                  nextParams.delete('q');
                  setSearchParams(nextParams);
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400 hover:text-brand-accent"
              >
                ✕
              </button>
            )}
          </form>

          {/* Horizontal Category Strip (Pills) */}
          {categories.length > 0 && (
            <div className="w-full">
              <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-2 scrollbar-none">
                <button
                  type="button"
                  onClick={() => handleCategoryPillClick(undefined)}
                  className={`text-[10px] font-bold uppercase tracking-wider py-2 px-4 rounded-full border transition-all ${
                    !categoryId
                      ? 'bg-brand-accent border-brand-accent text-white font-black'
                      : 'bg-transparent border-neutral-200 text-neutral-600 hover:border-brand-accent hover:text-brand-accent'
                  }`}
                >
                  Todos
                </button>
                {categories.map((cat) => {
                  const isActive = categoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategoryPillClick(cat.id)}
                      className={`text-[10px] font-bold uppercase tracking-wider py-2 px-4 rounded-full border transition-all ${
                        isActive
                          ? 'bg-brand-accent border-brand-accent text-white font-black'
                          : 'bg-transparent border-neutral-200 text-neutral-600 hover:border-brand-accent hover:text-brand-accent'
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Side Filters Panel */}
          <div className="md:col-span-1">
            <ProductFilters
              filters={{ categoryId, brandId, genderId, minPrice, maxPrice, branchId, attributes }}
              onFilterChange={updateFilters}
              onClearFilters={handleClearFilters}
            />
          </div>

          {/* Results Grid */}
          <div className="md:col-span-3 flex flex-col">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-transparent flex flex-col h-[400px]">
                    <div className="aspect-[4/5] bg-neutral-100 animate-pulse rounded-sm"></div>
                    <div className="pt-4 flex flex-col gap-2 flex-grow">
                      <div className="w-16 h-3 bg-neutral-100 animate-pulse rounded"></div>
                      <div className="w-3/4 h-4 bg-neutral-100 animate-pulse rounded"></div>
                      <div className="w-full h-3 bg-neutral-100 animate-pulse rounded mt-auto"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-700 p-6 text-center text-sm font-semibold rounded">
                {error}
              </div>
            ) : products.length === 0 ? (
              <div className="border border-neutral-100 rounded p-16 text-center">
                <Grid3X3 className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
                <h3 className="text-base font-bold text-neutral-800 mb-1">No se encontraron productos</h3>
                <p className="text-neutral-400 text-xs max-w-sm mx-auto mb-6">
                  Intenta cambiar las palabras clave de tu búsqueda o restablecer los filtros para ver más opciones.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-2.5 bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
                >
                  Restablecer Filtros
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                  {products.map((product) => {
                    const isOutOfStock = product.variants.every(v => v.outOfStock);
                    const firstVariant = product.variants[0];

                    const activeVariants = product.variants.filter(v => v.isActive);
                    const finalPrices = activeVariants.map((v) => {
                      const price = Number(v.price);
                      const discountPercent = (v as any).discountPercent || 0;
                      const discountAmount = (price * discountPercent) / 100;
                      return price - discountAmount;
                    });
                    const minPrice = finalPrices.length > 0 ? Math.min(...finalPrices) : 0;
                    const maxPrice = finalPrices.length > 0 ? Math.max(...finalPrices) : 0;

                    const discounts = activeVariants.map((v) => (v as any).discountPercent || 0);
                    const minDiscount = discounts.length > 0 ? Math.min(...discounts) : 0;
                    const maxDiscount = discounts.length > 0 ? Math.max(...discounts) : 0;

                    return (
                      <ProductCard
                        key={product.id}
                        variantId={firstVariant?.id || 0}
                        productSlug={product.slug}
                        productName={product.name}
                        brandName={product.brand?.name}
                        gender={product.gender}
                        description={product.description}
                        images={product.images}
                        minPrice={minPrice}
                        maxPrice={maxPrice}
                        minDiscount={minDiscount}
                        maxDiscount={maxDiscount}
                        isOutOfStock={isOutOfStock}
                      />
                    );
                  })}
                </div>

                {/* Pagination Cursor Trigger */}
                {nextCursor && (
                  <div className="flex justify-center mt-12">
                    <button
                      onClick={handleLoadMore}
                      disabled={isPaginationLoading}
                      className="px-8 py-3 bg-transparent border border-neutral-200 hover:border-neutral-900 text-neutral-800 text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-neutral-50 transition-all disabled:opacity-50"
                    >
                      {isPaginationLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-accent" />
                          Cargando más...
                        </>
                      ) : (
                        'Cargar más prendas'
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatalogPage;
