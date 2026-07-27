import React from 'react';
import type { KardexEntry } from '../types/kardex.types';
import { KardexTypeBadge } from './KardexTypeBadge';
import { ClipboardList, Loader2 } from 'lucide-react';

interface KardexTableProps {
  entries: KardexEntry[];
  loading: boolean;
  hasSelectedFilters: boolean;
}

export const KardexTable: React.FC<KardexTableProps> = ({
  entries,
  loading,
  hasSelectedFilters,
}) => {
  if (!hasSelectedFilters) {
    return (
      <div className="bg-white rounded-2xl border border-[#D9D9D2]/50 p-12 text-center flex flex-col items-center justify-center space-y-3">
        <ClipboardList className="w-12 h-12 text-[#6B6B6B]/40" />
        <h3 className="text-sm font-bold text-[#3F3F3F]">Selecciona un Producto y una Sucursal</h3>
        <p className="text-xs text-[#6B6B6B] max-w-xs">
          Para visualizar el historial de movimientos y costos unitarios (Kardex), es necesario definir una variante de producto y la sucursal de búsqueda.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-[#D9D9D2]/50 p-12 text-center flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-[#3F3F3F] animate-spin" />
        <p className="text-xs text-[#6B6B6B] font-bold">Cargando historial de movimientos...</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#D9D9D2]/50 p-12 text-center flex flex-col items-center justify-center space-y-3">
        <ClipboardList className="w-10 h-10 text-[#6B6B6B]/30" />
        <h3 className="text-sm font-bold text-[#3F3F3F]">Sin movimientos registrados</h3>
        <p className="text-xs text-[#6B6B6B] max-w-xs">
          No se encontraron transacciones ni asientos de inventario en el Kardex para los criterios de búsqueda especificados.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#D9D9D2]/50 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#FAFAFA] border-b border-[#D9D9D2]/40 text-[#6B6B6B] font-bold text-[10px] uppercase tracking-wider">
              <th className="px-5 py-3.5">Fecha/Hora</th>
              <th className="px-5 py-3.5 text-center">Tipo de Movimiento</th>
              <th className="px-5 py-3.5 text-right">Cantidad</th>
              <th className="px-5 py-3.5 text-right">Costo Unitario</th>
              <th className="px-5 py-3.5 text-right">P. Venta Actual</th>
              <th className="px-5 py-3.5 text-right">Saldo Cantidad</th>
              <th className="px-5 py-3.5 text-right">Saldo Costo</th>
              <th className="px-5 py-3.5">Asociado a</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D9D9D2]/20 text-[#3F3F3F] text-xs">
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-[#FAFAFA]/50 transition-colors">
                <td className="px-5 py-3.5 text-[#6B6B6B] whitespace-nowrap">
                  {new Date(entry.createdAt).toLocaleString('es-PE', {
                    dateStyle: 'short',
                    timeStyle: 'medium',
                  })}
                </td>
                <td className="px-5 py-3.5 text-center">
                  <KardexTypeBadge type={entry.type} />
                </td>
                <td className="px-5 py-3.5 font-bold text-right">
                  {entry.quantity > 0 ? `+${entry.quantity}` : entry.quantity}
                </td>
                <td className="px-5 py-3.5 font-semibold text-right">
                  S/. {entry.unitCost.toFixed(2)}
                </td>
                <td className="px-5 py-3.5 text-right text-[#6B6B6B]">
                  S/. {(entry.salePrice ?? 0).toFixed(2)}
                </td>
                <td className="px-5 py-3.5 font-black text-right text-[#3F3F3F]">
                  {entry.balanceQty}
                </td>
                <td className="px-5 py-3.5 font-extrabold text-right text-gray-700">
                  S/. {entry.balanceCost.toFixed(2)}
                </td>
                <td className="px-5 py-3.5 text-[#6B6B6B] font-semibold">
                  {entry.userName || <span className="font-normal">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
