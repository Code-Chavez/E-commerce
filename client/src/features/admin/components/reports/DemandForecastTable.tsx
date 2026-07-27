import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Archive } from 'lucide-react';
import type { DemandForecastItem } from '../../types/forecast.types';

interface DemandForecastTableProps {
  items: DemandForecastItem[];
}

type SortKey = 'categoryName' | 'size' | 'projectedDemand';
type SortDirection = 'asc' | 'desc';

const SortIcon = ({ columnKey, sortKey, sortDirection }: { columnKey: SortKey; sortKey: SortKey; sortDirection: SortDirection }) => {
  if (sortKey !== columnKey) return null;
  return sortDirection === 'asc' 
    ? <ChevronUp className="w-4 h-4 ml-1 text-[#3F3F3F]" /> 
    : <ChevronDown className="w-4 h-4 ml-1 text-[#3F3F3F]" />;
};

export const DemandForecastTable: React.FC<DemandForecastTableProps> = ({ items }) => {
  const [sortKey, setSortKey] = useState<SortKey>('projectedDemand');
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
      const valA: any = a[sortKey];
      const valB: any = b[sortKey];

      if (valA === null || valA === undefined) return sortDirection === 'asc' ? -1 : 1;
      if (valB === null || valB === undefined) return sortDirection === 'asc' ? 1 : -1;

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDirection === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      }

      return sortDirection === 'asc' 
        ? (valA > valB ? 1 : -1) 
        : (valA < valB ? 1 : -1);
    });
    return sorted;
  }, [items, sortKey, sortDirection]);

  // SortIcon is defined outside this component

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-[#D9D9D2]/40 shadow-sm text-center">
        <div className="p-4 bg-gray-50 rounded-full text-gray-400 mb-4">
          <Archive className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-[#3F3F3F]">No se encontraron predicciones</h3>
        <p className="text-xs text-[#6B6B6B] mt-1 max-w-xs">
          No hay suficiente historial de ventas para generar predicciones en el periodo especificado.
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
                onClick={() => handleSort('categoryName')}
              >
                <div className="flex items-center">
                  Categoría
                  <SortIcon columnKey="categoryName" sortKey={sortKey} sortDirection={sortDirection} />
                </div>
              </th>
              <th 
                className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                onClick={() => handleSort('size')}
              >
                <div className="flex items-center">
                  Talla
                  <SortIcon columnKey="size" sortKey={sortKey} sortDirection={sortDirection} />
                </div>
              </th>
              <th 
                className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                onClick={() => handleSort('projectedDemand')}
              >
                <div className="flex items-center">
                  Demanda Proyectada
                  <SortIcon columnKey="projectedDemand" sortKey={sortKey} sortDirection={sortDirection} />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D9D9D2]/25 text-sm text-[#3F3F3F]">
            {sortedItems.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-semibold text-gray-800">
                  {item.categoryName}
                </td>
                <td className="px-6 py-4 text-xs font-bold text-gray-600">
                  {item.size}
                </td>
                <td className="px-6 py-4 font-mono font-bold text-gray-900">
                  {item.projectedDemand.toFixed(1)} und.
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
