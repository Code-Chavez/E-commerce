import React from 'react';
import type { KardexType } from '../types/kardex.types';

interface KardexTypeBadgeProps {
  type: KardexType;
}

const TYPE_STYLES: Record<KardexType, string> = {
  COMPRA: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  VENTA: 'bg-blue-50 border-blue-200 text-blue-700',
  TRANSFERENCIA: 'bg-purple-50 border-purple-200 text-purple-700',
  DEVOLUCION: 'bg-amber-50 border-amber-200 text-amber-700',
  AJUSTE: 'bg-slate-50 border-slate-200 text-slate-600',
};

const TYPE_LABELS: Record<KardexType, string> = {
  COMPRA: 'Compra',
  VENTA: 'Venta',
  TRANSFERENCIA: 'Transferencia',
  DEVOLUCION: 'Devolución',
  AJUSTE: 'Ajuste',
};

export const KardexTypeBadge: React.FC<KardexTypeBadgeProps> = ({ type }) => {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border ${TYPE_STYLES[type] || 'bg-gray-50 border-gray-200 text-gray-700'}`}>
      {TYPE_LABELS[type] || type}
    </span>
  );
};
