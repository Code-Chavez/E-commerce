import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import type { FinancialDashboardSummary } from '../../../types/financial-dashboard';

interface FinancialLineChartProps {
  summary: FinancialDashboardSummary | null;
}

export const FinancialLineChart: React.FC<FinancialLineChartProps> = ({ summary }) => {
  if (!summary) return null;

  const { currentPeriod, previousPeriod } = summary;

  const chartData = [
    {
      name: 'Período Anterior',
      POS: previousPeriod.posRevenue,
      Ecommerce: previousPeriod.ecommerceRevenue,
      Total: previousPeriod.totalRevenue
    },
    {
      name: 'Período Actual',
      POS: currentPeriod.posRevenue,
      Ecommerce: currentPeriod.ecommerceRevenue,
      Total: currentPeriod.totalRevenue
    }
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 mb-6">
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-6">
        Comparativa de Canales (POS vs E-commerce)
      </h3>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
            <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} />
            <YAxis
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatCurrency(v)}
            />
            <Tooltip
              formatter={(value: any) => [formatCurrency(Number(value || 0)), '']}
              contentStyle={{
                backgroundColor: '#FFF',
                border: '1px solid #E5E7EB',
                borderRadius: '0.75rem',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
              }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            <Line
              type="monotone"
              dataKey="POS"
              name="Ventas Físicas (POS)"
              stroke="#6366F1"
              strokeWidth={3}
              activeDot={{ r: 8 }}
            />
            <Line
              type="monotone"
              dataKey="Ecommerce"
              name="Venta Online"
              stroke="#06B6D4"
              strokeWidth={3}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
