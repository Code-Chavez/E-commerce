import React from 'react';
import { Layers, AlertTriangle, ArrowDownToLine, Box } from 'lucide-react';
import type { StockItem } from '../hooks/useStock';
import type { Branch } from '../../branches/hooks/useBranches';

interface StockTableProps {
  stock: StockItem[];
  activeBranches: Branch[];
  minStockThreshold: number;
}

export const StockTable: React.FC<StockTableProps> = ({
  stock,
  activeBranches,
  minStockThreshold,
}) => {
  if (stock.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-[#D9D9D2]/30 shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D9D9D2]/20 text-[#6B6B6B] mb-4">
          <Layers className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-[#3F3F3F]">No se encontraron existencias</h3>
        <p className="text-sm text-[#6B6B6B] mt-1 max-w-sm">
          No hay registros de stock que coincidan con la búsqueda o filtros aplicados.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#D9D9D2]/30 bg-white shadow-sm">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-[#FAFAFA] border-b border-[#D9D9D2]/40">
            <th className="py-4 px-6 text-xs font-bold text-[#3F3F3F] uppercase tracking-wider">
              Variante / SKU
            </th>
            <th className="py-4 px-6 text-xs font-bold text-[#3F3F3F] uppercase tracking-wider">
              Producto
            </th>
            <th className="py-4 px-6 text-xs font-bold text-[#3F3F3F] uppercase tracking-wider text-center">
              Stock Global
            </th>
            {/* Dynamic Sede Columns */}
            {activeBranches.map((branch) => (
              <th 
                key={branch.id} 
                className="py-4 px-6 text-xs font-bold text-[#3F3F3F] uppercase tracking-wider text-center"
              >
                {branch.name}
              </th>
            ))}
            <th className="py-4 px-6 text-xs font-bold text-[#3F3F3F] uppercase tracking-wider text-center">
              Alerta
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#D9D9D2]/20">
          {stock.map((item) => {
            const isLowStock = item.globalStock <= minStockThreshold;
            const isOutOfStock = item.globalStock === 0;

            return (
              <tr 
                key={item.variantId}
                className={`transition-colors ${
                  isOutOfStock
                    ? 'bg-red-50/20 hover:bg-red-50/30'
                    : isLowStock 
                      ? 'bg-amber-50/20 hover:bg-amber-50/30' 
                      : 'hover:bg-[#FAFAFA]/50'
                }`}
              >
                {/* SKU Info */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-semibold text-xs ${
                      isOutOfStock
                        ? 'bg-red-100 text-red-700'
                        : isLowStock
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-[#3F3F3F]/5 text-[#3F3F3F]'
                    }`}>
                      <Box className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-mono text-xs font-bold text-[#3F3F3F]">{item.sku}</span>
                      <span className="text-[10px] text-[#6B6B6B] mt-0.5 block">ID: #{item.variantId}</span>
                    </div>
                  </div>
                </td>

                {/* Product Name */}
                <td className="py-4 px-6 text-sm text-[#3F3F3F]">
                  <span className="font-semibold">{item.productName}</span>
                </td>

                {/* Global Stock */}
                <td className="py-4 px-6 text-center">
                  <span className={`inline-flex items-center justify-center font-extrabold text-sm px-2.5 py-1 rounded-lg ${
                    isOutOfStock
                      ? 'bg-red-100 text-red-800'
                      : isLowStock
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-[#3F3F3F]/5 text-[#3F3F3F]'
                  }`}>
                    {item.globalStock}
                  </span>
                </td>

                {/* Dynamic Sede Stocks */}
                {activeBranches.map((branch) => {
                  const qty = item.byBranch.find(b => b.branchId === branch.id)?.quantity ?? 0;
                  return (
                    <td key={branch.id} className="py-4 px-6 text-center text-sm">
                      <span className={`font-semibold ${qty === 0 ? 'text-[#6B6B6B]/40' : 'text-[#3F3F3F]'}`}>
                        {qty}
                      </span>
                    </td>
                  );
                })}

                {/* Status Alert Badge */}
                <td className="py-4 px-6 text-center">
                  {isOutOfStock ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Agotado
                    </span>
                  ) : isLowStock ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                      <ArrowDownToLine className="w-3.5 h-3.5" />
                      Reabastecer
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30" title="Stock Óptimo" />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
