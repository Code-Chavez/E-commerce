import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Archive } from 'lucide-react';
import type { RestockSuggestionItem } from '../../types/forecast.types';

interface RestockSuggestionsTableProps {
  items: RestockSuggestionItem[];
}

type SortKey = 'variantId' | 'currentStock' | 'suggestedQty';
type SortDirection = 'asc' | 'desc';

export const RestockSuggestionsTable: React.FC<RestockSuggestionsTableProps> = ({ items }) => {
  const [sortKey, setSortKey] = useState<SortKey>('suggestedQty');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const sortedItems = useMemo(() => {
    const sorted = [...items];
    sorted.sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });
    return sorted;
  }, [items, sortKey, sortDirection]);

  const renderSortIcon = (columnKey: SortKey) => {
    if (sortKey !== columnKey) return null;
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-4 h-4 ml-1 text-[#3F3F3F]" /> 
      : <ChevronDown className="w-4 h-4 ml-1 text-[#3F3F3F]" />;
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-[#D9D9D2]/40 shadow-sm text-center">
        <div className="p-4 bg-gray-50 rounded-full text-gray-400 mb-4">
          <Archive className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-[#3F3F3F]">No hay sugerencias de abastecimiento</h3>
        <p className="text-xs text-[#6B6B6B] mt-1 max-w-xs">
          El stock disponible en sucursales es suficiente para cubrir la demanda proyectada.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#D9D9D2]/40 shadow-sm overflow-hidden flex-1">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#FAFAFA] border-b border-[#D9D9D2]/40 text-xs font-bold text-[#3F3F3F] uppercase tracking-wider">
              <th 
                className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                onClick={() => handleSort('variantId')}
              >
                <div className="flex items-center">
                  ID Variante
                  {renderSortIcon('variantId')}
                </div>
              </th>
              <th 
                className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                onClick={() => handleSort('currentStock')}
              >
                <div className="flex items-center">
                  Stock Actual
                  {renderSortIcon('currentStock')}
                </div>
              </th>
              <th 
                className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                onClick={() => handleSort('suggestedQty')}
              >
                <div className="flex items-center">
                  Cantidad Sugerida
                  {renderSortIcon('suggestedQty')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D9D9D2]/25 text-sm text-[#3F3F3F]">
            {sortedItems.map((item) => (
              <tr key={item.variantId} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-mono font-bold text-gray-700">
                  #{item.variantId}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-sm font-semibold ${item.currentStock === 0 ? 'text-rose-600 font-bold' : 'text-gray-900'}`}>
                    {item.currentStock} und.
                  </span>
                </td>
                <td className="px-6 py-4 font-mono font-bold text-[#3F3F3F]">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#3F3F3F]/5 text-[#3F3F3F] border border-[#D9D9D2]/30">
                    +{item.suggestedQty} und.
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
