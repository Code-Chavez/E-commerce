import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { BranchSales } from '../types/dashboard.types';

interface BranchSalesChartProps {
  data: BranchSales[];
}

export const BranchSalesChart: React.FC<BranchSalesChartProps> = ({ data }) => {
  const formattedData = data.map((item) => ({
    name: item.branchName,
    Ventas: item.totalSales,
  }));

  // Paleta de colores alineada con la marca
  const colors = ['#3F3F3F', '#6B6B6B', '#8C8C8C', '#B5B5B5'];

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[380px]">
      <div>
        <h4 className="text-sm font-bold text-gray-800 tracking-tight">Comparativa de Ventas del Día</h4>
        <p className="text-[10px] text-brand-text mt-0.5">Ventas totales acumuladas hoy (POS + E-commerce) por sucursal</p>
      </div>

      <div className="flex-1 w-full mt-4 text-[10px] md:text-xs">
        {formattedData.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium">
            Sin datos de ventas registrados hoy
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={formattedData}
              margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis 
                dataKey="name" 
                tickLine={false} 
                axisLine={false}
                stroke="#6B6B6B"
                fontSize={10}
                fontWeight={600}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false}
                stroke="#6B6B6B"
                fontSize={10}
                fontWeight={600}
                tickFormatter={(value) => `S/ ${value}`}
              />
              <Tooltip
                cursor={{ fill: '#F9FAFB' }}
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  fontSize: '11px',
                  fontWeight: 'bold',
                }}
                formatter={(value: any) => [`S/ ${Number(value).toFixed(2)}`, 'Ventas']}
                labelStyle={{ color: '#3F3F3F', fontWeight: '800' }}
              />
              <Bar 
                dataKey="Ventas" 
                radius={[6, 6, 0, 0]} 
                maxBarSize={45}
              >
                {formattedData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
export default BranchSalesChart;
