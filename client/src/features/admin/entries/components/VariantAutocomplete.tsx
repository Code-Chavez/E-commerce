import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Shirt } from 'lucide-react';
import { useStockEntries } from '../hooks/useStockEntries';
import type { VariantSearchResult } from '../hooks/useStockEntries';

interface VariantAutocompleteProps {
  onSelect: (variant: VariantSearchResult) => void;
  excludeVariantIds?: number[];
}

export const VariantAutocomplete: React.FC<VariantAutocompleteProps> = ({
  onSelect,
  excludeVariantIds = [],
}) => {
  const { searchVariants, searchingVariants } = useStockEntries();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<VariantSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debouncing query change
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        const data = await searchVariants(query);
        // Filter out already selected variants to avoid duplicates
        const filtered = data.filter((v) => !excludeVariantIds.includes(v.id));
        setResults(filtered);
        setIsOpen(true);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, searchVariants, excludeVariantIds]);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelectResult = (variant: VariantSearchResult) => {
    onSelect(variant);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B6B6B]">
          {searchingVariants ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#3F3F3F]" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>
        <input
          type="text"
          placeholder="Escribe SKU o nombre del producto para buscar variantes (mín. 2 letras)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#D9D9D2]/70 bg-white text-sm text-[#3F3F3F] placeholder-[#6B6B6B]/50 focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]/20 focus:border-[#3F3F3F] transition-all"
        />
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1.5 bg-white border border-[#D9D9D2]/40 rounded-xl shadow-xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200">
          {results.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#6B6B6B]">
              No se encontraron variantes activas para "{query}"
            </div>
          ) : (
            <div className="p-1.5 space-y-1">
              {results.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => handleSelectResult(variant)}
                  className="w-full flex items-center justify-between text-left p-3 hover:bg-[#FAFAFA] rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#3F3F3F]/5 text-[#3F3F3F] group-hover:bg-[#3F3F3F] group-hover:text-white transition-colors">
                      <Shirt className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-bold text-xs text-[#3F3F3F]">{variant.sku}</span>
                      <span className="block text-[11px] text-[#6B6B6B] truncate max-w-[250px] md:max-w-[400px]">
                        {variant.productName}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-[#6B6B6B] group-hover:text-[#3F3F3F]">
                    S/. {Number(variant.price).toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
