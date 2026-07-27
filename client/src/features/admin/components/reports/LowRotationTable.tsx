import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Archive } from 'lucide-react';
import type { LowRotationItem } from '../../types/lowRotation.types';

interface LowRotationTableProps {
  items: LowRotationItem[];
}

type SortKey = 'sku' | 'productName' | 'daysWithoutMovement' | 'lastMovementDate' | 'currentStock';
type SortDirection = 'asc' | 'desc';

const SortIcon = ({ columnKey, sortKey, sortDirection }: { columnKey: SortKey; sortKey: SortKey; sortDirection: SortDirection }) => {
  if (sortKey !== columnKey) return null;
  return sortDirection === 'asc' 
    ? <ChevronUp className="w-4 h-4 ml-1 text-[#3F3F3F]" /> 
    : <ChevronDown className="w-4 h-4 ml-1 text-[#3F3F3F]" />;
};

export const LowRotationTable: React.FC<LowRotationTableProps> = ({ items }) => {
  const [sortKey, setSortKey] = useState<SortKey>('daysWithoutMovement');
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

      // Handle null cases
      if (valA === null || valA === undefined) return sortDirection === 'asc' ? -1 : 1;
      if (valB === null || valB === undefined) return sortDirection === 'asc' ? 1 : -1;

      // Special string normalization for sorting
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDirection === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      }

      // Default numeric/date comparison
      if (sortKey === 'lastMovementDate') {
        const dateA = new Date(valA).getTime();
        const dateB = new Date(valB).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
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
        <h3 className="text-base font-bold text-[#3F3F3F]">No se encontraron productos con baja rotación</h3>
        <p className="text-xs text-[#6B6B6B] mt-1 max-w-xs">
          Todos los productos registran movimientos de salida en el periodo establecido o no existen variantes cargadas.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#D9D9D2]/40 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#FAFAFA] border-b border-[#D9D9D2]/40 text-xs font-bold text-[#3F3F3F] uppercase tracking-wider">
              <th 
                className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                onClick={() => handleSort('sku')}
              >
                <div className="flex items-center">
                  SKU
                  <SortIcon columnKey="sku" sortKey={sortKey} sortDirection={sortDirection} />
                </div>
              </th>
              <th 
                className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                onClick={() => handleSort('productName')}
              >
                <div className="flex items-center">
                  Producto
                  <SortIcon columnKey="productName" sortKey={sortKey} sortDirection={sortDirection} />
                </div>
              </th>
              <th className="px-6 py-4 select-none">
                Atributos
              </th>
              <th 
                className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                onClick={() => handleSort('daysWithoutMovement')}
              >
                <div className="flex items-center">
                  Días sin Venta
                  <SortIcon columnKey="daysWithoutMovement" sortKey={sortKey} sortDirection={sortDirection} />
                </div>
              </th>
              <th 
                className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                onClick={() => handleSort('lastMovementDate')}
              >
                <div className="flex items-center">
                  Última Salida
                  <SortIcon columnKey="lastMovementDate" sortKey={sortKey} sortDirection={sortDirection} />
                </div>
              </th>
              <th 
                className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                onClick={() => handleSort('currentStock')}
              >
                <div className="flex items-center">
                  Stock Actual
                  <SortIcon columnKey="currentStock" sortKey={sortKey} sortDirection={sortDirection} />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D9D9D2]/25 text-sm text-[#3F3F3F]">
            {sortedItems.map((item) => (
              <tr key={item.variantId} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-mono text-xs font-semibold text-gray-600">
                  {item.sku || '-'}
                </td>
                <td className="px-6 py-4 font-semibold text-gray-800">
                  {item.productName}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(item.attributes).map(([key, val]) => (
                      <span 
                        key={key} 
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#3F3F3F]/5 text-[#3F3F3F] border border-[#D9D9D2]/30"
                      >
                        {key}: {val}
                      </span>
                    ))}
                    {Object.keys(item.attributes).length === 0 && (
                      <span className="text-xs text-gray-400 font-medium">-</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    item.daysWithoutMovement >= 120 
                      ? 'bg-rose-50 text-rose-700 border border-rose-100'
                      : item.daysWithoutMovement >= 90
                      ? 'bg-amber-50 text-amber-700 border border-amber-100'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  }`}>
                    {item.daysWithoutMovement} días
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-gray-500 font-semibold">
                  {item.lastMovementDate 
                    ? new Date(item.lastMovementDate).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })
                    : 'Sin registro (Novedad)'
                  }
                </td>
                <td className="px-6 py-4">
                  <span className={`text-sm font-bold ${item.currentStock === 0 ? 'text-gray-400' : 'text-gray-900'}`}>
                    {item.currentStock} und.
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
