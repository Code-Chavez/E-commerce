import React from 'react';
import { TrendingUp, TrendingDown, Landmark, Monitor, Store } from 'lucide-react';
import type { FinancialDashboardSummary } from '../../../types/financial-dashboard';

interface KpiCardsProps {
  summary: FinancialDashboardSummary | null;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ summary }) => {
  if (!summary) return null;

  const { currentPeriod, comparison } = summary;
  const isPositive = comparison.revenuePercentageChange >= 0;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(val);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {/* Total Revenue */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Ingresos Totales</span>
          <div className="w-10 h-10 rounded-xl bg-brand-accent/10 text-brand-accent flex items-center justify-center shrink-0">
            <Landmark className="w-5 h-5" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">
            {formatCurrency(currentPeriod.totalRevenue)}
          </h3>
          <div className="flex items-center gap-1.5 mt-2">
            {isPositive ? (
              <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <TrendingUp className="w-3.5 h-3.5" />
                +{comparison.revenuePercentageChange.toFixed(2)}%
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                <TrendingDown className="w-3.5 h-3.5" />
                {comparison.revenuePercentageChange.toFixed(2)}%
              </span>
            )}
            <span className="text-xs text-gray-400">vs período anterior</span>
          </div>
        </div>
      </div>

      {/* POS Revenue */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Ventas Físicas (POS)</span>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Store className="w-5 h-5" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">
            {formatCurrency(currentPeriod.posRevenue)}
          </h3>
          <p className="text-xs text-gray-400 mt-2">
            {(currentPeriod.totalRevenue > 0
              ? (currentPeriod.posRevenue / currentPeriod.totalRevenue) * 100
              : 0
            ).toFixed(1)}% del total
          </p>
        </div>
      </div>

      {/* E-commerce Revenue */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Venta Online (E-commerce)</span>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Monitor className="w-5 h-5" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">
            {formatCurrency(currentPeriod.ecommerceRevenue)}
          </h3>
          <p className="text-xs text-gray-400 mt-2">
            {(currentPeriod.totalRevenue > 0
              ? (currentPeriod.ecommerceRevenue / currentPeriod.totalRevenue) * 100
              : 0
            ).toFixed(1)}% del total
          </p>
        </div>
      </div>
    </div>
  );
};
