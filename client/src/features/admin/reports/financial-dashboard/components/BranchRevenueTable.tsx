import React from 'react';
import type { FinancialDashboardSummary } from '../../../types/financial-dashboard';

interface BranchRevenueTableProps {
  summary: FinancialDashboardSummary | null;
}

export const BranchRevenueTable: React.FC<BranchRevenueTableProps> = ({ summary }) => {
  if (!summary) return null;

  const { currentPeriod, previousPeriod } = summary;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(val);
  };

  // Build rows combining current and previous period branch data
  const rows = currentPeriod.revenueByBranch.map(currBranch => {
    const prevBranch = previousPeriod.revenueByBranch.find(
      p => p.branchName === currBranch.branchName || (p.branchId !== null && p.branchId === currBranch.branchId)
    );

    const prevTotal = prevBranch ? prevBranch.total : 0;
    const diff = currBranch.total - prevTotal;
    const percentChange = prevTotal > 0 ? (diff / prevTotal) * 100 : 0;

    return {
      name: currBranch.branchName,
      currentTotal: currBranch.total,
      previousTotal: prevTotal,
      diff,
      percentChange
    };
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 mb-6">
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
        Desglose Comparativo por Sucursal y Canales
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <th className="py-3 px-4">Canal / Sucursal</th>
              <th className="py-3 px-4 text-right">Período Anterior</th>
              <th className="py-3 px-4 text-right">Período Actual</th>
              <th className="py-3 px-4 text-right">Diferencia</th>
              <th className="py-3 px-4 text-right">Variación %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
            {rows.map((row, idx) => {
              const isPositive = row.diff >= 0;
              return (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-gray-900">{row.name}</td>
                  <td className="py-3.5 px-4 text-right font-mono text-gray-500">
                    {formatCurrency(row.previousTotal)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-gray-900">
                    {formatCurrency(row.currentTotal)}
                  </td>
                  <td className={`py-3.5 px-4 text-right font-mono font-semibold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isPositive ? '+' : ''}{formatCurrency(row.diff)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {isPositive ? (
                      <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        +{row.percentChange.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                        {row.percentChange.toFixed(1)}%
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
