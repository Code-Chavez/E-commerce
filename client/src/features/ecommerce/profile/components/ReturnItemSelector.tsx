import React from 'react';
import type { OrderItem } from '../../types';

interface ReturnItemSelectorProps {
  items: OrderItem[];
  selectedItems: Record<number, number>; // orderItemId -> qty
  onSelectItem: (orderItemId: number, checked: boolean) => void;
  onChangeQty: (orderItemId: number, qty: number) => void;
}

export const ReturnItemSelector: React.FC<ReturnItemSelectorProps> = ({
  items,
  selectedItems,
  onSelectItem,
  onChangeQty,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-extrabold text-brand-accent">
        Selecciona los productos a devolver
      </h3>
      <div className="divide-y divide-brand-primary/10 border border-brand-primary/20 rounded-2xl overflow-hidden bg-white">
        {items.map((item) => {
          const isSelected = selectedItems[item.id] !== undefined;
          const currentQty = selectedItems[item.id] || 1;

          return (
            <div
              key={item.id}
              className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                isSelected ? 'bg-brand-primary/5' : ''
              }`}
            >
              {/* Checkbox & Product Info */}
              <div className="flex items-start gap-3 flex-1">
                <input
                  type="checkbox"
                  id={`item-${item.id}`}
                  checked={isSelected}
                  onChange={(e) => onSelectItem(item.id, e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-accent focus:ring-brand-accent cursor-pointer"
                />
                <label htmlFor={`item-${item.id}`} className="cursor-pointer select-none">
                  <p className="text-xs font-extrabold text-[#3F3F3F]">{item.productName}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">SKU: {item.variantSku}</p>
                  <p className="text-[11px] font-semibold text-brand-text mt-1">
                    Precio unitario: S/ {Number(item.unitPrice).toFixed(2)}
                  </p>
                </label>
              </div>

              {/* Quantity selector (Only active when selected) */}
              <div className="flex items-center gap-3 justify-end sm:justify-start">
                <span className="text-[11px] text-brand-text font-semibold">Cant:</span>
                <select
                  disabled={!isSelected}
                  value={currentQty}
                  onChange={(e) => onChangeQty(item.id, Number(e.target.value))}
                  className="rounded-lg border border-brand-primary/30 p-1 text-xs font-bold text-[#3F3F3F] focus:border-brand-accent outline-none bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {Array.from({ length: item.qty }, (_, i) => i + 1).map((val) => (
                    <option key={val} value={val}>
                      {val}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-gray-400">
                  (Máx. {item.qty} comprados)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
