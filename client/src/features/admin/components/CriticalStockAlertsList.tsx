import React from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import type { CriticalStockProduct } from '../types/dashboard.types';

interface CriticalStockAlertsListProps {
  products: CriticalStockProduct[];
}

export const CriticalStockAlertsList: React.FC<CriticalStockAlertsListProps> = ({ products }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[380px]">
      <div>
        <h4 className="text-sm font-bold text-gray-800 tracking-tight">Alertas de Stock Crítico</h4>
        <p className="text-[10px] text-brand-text mt-0.5">Productos que se encuentran por debajo del stock mínimo establecido</p>
      </div>

      <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-3 scrollbar-none">
        {products.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2 font-semibold">
            <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-xs">Todo en orden. No hay alertas de stock</span>
          </div>
        ) : (
          products.map((product, idx) => {
            const isSevere = product.currentStock <= 1;

            return (
              <div 
                key={idx} 
                className={`p-3.5 border rounded-xl flex gap-3 items-start transition-all ${
                  isSevere 
                    ? 'bg-red-50/50 border-red-100 text-red-700' 
                    : 'bg-amber-50/50 border-amber-100 text-amber-700'
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                  isSevere ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                }`}>
                  {isSevere ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <p className="font-extrabold text-xs truncate text-gray-900">{product.productName}</p>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                      isSevere ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {product.currentStock} ud
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-brand-text truncate mt-1">SKU: <span className="font-mono text-gray-600">{product.sku}</span></p>
                  <div className="flex justify-between items-center text-[9px] font-bold text-gray-400 mt-1">
                    <span>{product.branchName}</span>
                    <span>Mín: {product.minStock} ud</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
export default CriticalStockAlertsList;
