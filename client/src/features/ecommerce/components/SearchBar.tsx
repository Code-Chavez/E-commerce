import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { searchProducts } from '../services/search.service';
import type { SearchProductItem } from '../types/search.types';

export const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }
      setIsLoading(true);
      try {
        const response = await searchProducts({ q: debouncedQuery, limit: 5 });
        if (response.success) {
          setResults(response.data);
        }
      } catch (error) {
        console.error('Error fetching search suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/catalog?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
    }
  };

  const handleSuggestionClick = (productName: string) => {
    navigate(`/catalog?q=${encodeURIComponent(productName)}`);
    setQuery(productName);
    setIsOpen(false);
  };

  const getProductPriceString = (product: SearchProductItem) => {
    const activeVariants = product.variants.filter(v => v.isActive);
    if (activeVariants.length === 0) return 'N/A';
    const prices = activeVariants.map(v => Number(v.price));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    if (minPrice === maxPrice) {
      return `S/ ${minPrice.toFixed(2)}`;
    }
    return `S/ ${minPrice.toFixed(2)} - S/ ${maxPrice.toFixed(2)}`;
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-[280px] lg:max-w-md">
      <form onSubmit={handleSearchSubmit} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Buscar prendas..."
          className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-800 placeholder-slate-400 pl-9 pr-9 py-2 rounded-full border border-slate-200 focus:border-brand-accent/50 focus:outline-none focus:ring-2 focus:ring-brand-accent/10 transition-all text-xs font-semibold shadow-sm"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search className="w-3.5 h-3.5" />
        </div>
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-accent" />
          </div>
        )}
      </form>

      {/* Suggestion Dropdown */}
      {isOpen && query.trim() !== '' && (
        <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-xl z-50 overflow-hidden backdrop-blur-md bg-white/95 max-h-[350px] flex flex-col">
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Sugerencias</span>
            {results.length > 0 && (
              <button
                onClick={() => {
                  navigate(`/catalog?q=${encodeURIComponent(query.trim())}`);
                  setIsOpen(false);
                }}
                className="text-[10px] font-bold text-brand-accent hover:underline"
              >
                Ver todos
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
            {isLoading && results.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs flex flex-col items-center gap-1.5">
                <Loader2 className="w-4 h-4 animate-spin text-brand-accent" />
                <span>Buscando...</span>
              </div>
            ) : results.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs">
                No se encontraron prendas para "{query}"
              </div>
            ) : (
              results.map((product) => {
                const mainImage = product.images.find(img => img.isMain)?.url || product.images[0]?.url;
                const isOutOfStock = product.variants.every(v => v.outOfStock);

                return (
                  <div
                    key={product.id}
                    onClick={() => handleSuggestionClick(product.name)}
                    className="p-2.5 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <div className="w-8 h-8 rounded-md bg-slate-100 border border-slate-200/60 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {mainImage ? (
                        <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Search className="w-3.5 h-3.5 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-start gap-1.5">
                        <h4 className="text-[11px] font-bold text-slate-800 truncate">{product.name}</h4>
                        <span className="text-[11px] font-black text-brand-accent flex-shrink-0">
                          {getProductPriceString(product)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] text-slate-400 bg-slate-100 px-1 py-0.5 rounded font-medium">
                          {product.category?.name}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          {product.brand?.name}
                        </span>
                        {isOutOfStock && (
                          <span className="text-[8px] font-bold text-red-500 bg-red-50 px-1 rounded shrink-0">
                            Agotado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
