import React from 'react';
import type { ProfitabilityReportItem, ProfitabilityReportTotals } from '../../../types/profitability';

interface ProfitabilityTableProps {
  items: ProfitabilityReportItem[];
  totals: ProfitabilityReportTotals | null;
  groupByTitle: string;
}

export const ProfitabilityTable: React.FC<ProfitabilityTableProps> = ({ items, totals, groupByTitle }) => {
  // Helpers para formateo
  const formatCurrency = (val: number) => `S/ ${val.toFixed(2)}`;
  const formatPercent = (val: number) => `${val.toFixed(2)}%`;

  // Estilo condicional: si margen es negativo, se renderiza con rojo
  const getMarginClass = (margin: number) => {
    return margin < 0 ? 'text-red-600 font-extrabold bg-red-50' : 'text-emerald-600 font-bold';
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{groupByTitle}</th>
            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Cant. Vendida</th>
            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Ventas Totales</th>
            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Costo Total</th>
            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Utilidad Bruta</th>
            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Margen %</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-sm text-gray-800 font-semibold">{item.name}</td>
              <td className="px-4 py-3 text-sm text-gray-600 text-right">{item.totalQuantity}</td>
              <td className="px-4 py-3 text-sm text-gray-600 text-right">{formatCurrency(item.totalRevenue)}</td>
              <td className="px-4 py-3 text-sm text-gray-600 text-right">{formatCurrency(item.totalCost)}</td>
              <td className="px-4 py-3 text-sm text-gray-800 font-bold text-right">{formatCurrency(item.grossProfit)}</td>
              <td className={`px-4 py-3 text-sm text-right ${getMarginClass(item.profitMarginPercentage)}`}>
                <span className="px-2 py-0.5 rounded">{formatPercent(item.profitMarginPercentage)}</span>
              </td>
            </tr>
          ))}

          {/* Fila de Totales */}
          {totals && items.length > 0 && (
            <tr className="bg-gray-100/75 border-t-2 border-gray-200">
              <td className="px-4 py-4 text-sm font-extrabold text-gray-800 uppercase">Totales del Reporte</td>
              <td className="px-4 py-4 text-sm font-bold text-gray-800 text-right">{totals.totalQuantity}</td>
              <td className="px-4 py-4 text-sm font-bold text-gray-800 text-right">{formatCurrency(totals.totalRevenue)}</td>
              <td className="px-4 py-4 text-sm font-bold text-gray-800 text-right">{formatCurrency(totals.totalCost)}</td>
              <td className="px-4 py-4 text-sm font-extrabold text-brand-accent text-right">{formatCurrency(totals.grossProfit)}</td>
              <td className={`px-4 py-4 text-sm text-right ${getMarginClass(totals.profitMarginPercentage)}`}>
                <span className="px-2 py-0.5 rounded">{formatPercent(totals.profitMarginPercentage)}</span>
              </td>
            </tr>
          )}

          {items.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-12 text-center text-gray-500 text-sm">
                No hay datos disponibles para mostrar en este reporte.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
