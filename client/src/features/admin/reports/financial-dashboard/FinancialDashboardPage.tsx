import React, { useState, useEffect } from 'react';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { DashboardFilters } from './components/DashboardFilters';
import { KpiCards } from './components/KpiCards';
import { FinancialLineChart } from './components/FinancialLineChart';
import { BranchRevenueTable } from './components/BranchRevenueTable';
import { useFinancialDashboard } from './hooks/useFinancialDashboard';
import { Landmark, Loader2 } from 'lucide-react';

export const FinancialDashboardPage: React.FC = () => {
  useDocumentTitle('Dashboard Financiero - D\'Mendoza');

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { loading, summary, fetchDashboard } = useFinancialDashboard();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleApplyFilters = () => {
    fetchDashboard(fromDate, toDate);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-accent/10 text-brand-accent flex items-center justify-center shrink-0">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-brand-accent tracking-tight">
              Dashboard Financiero Consolidado
            </h2>
            <p className="text-xs text-brand-text mt-0.5">
              Consolidación de ingresos del canal POS y E-commerce, comparativas y desglose por sucursal.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <DashboardFilters
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onApply={handleApplyFilters}
        loading={loading}
      />

      {loading && !summary ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Loader2 className="w-10 h-10 animate-spin text-brand-accent mb-4" />
          <p className="text-sm font-bold text-gray-500">Cargando reporte financiero...</p>
        </div>
      ) : summary ? (
        <>
          {/* KPI Cards */}
          <KpiCards summary={summary} />

          {/* Financial Chart */}
          <FinancialLineChart summary={summary} />

          {/* Branch Table */}
          <BranchRevenueTable summary={summary} />
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm text-sm text-gray-400">
          No hay datos disponibles para el rango seleccionado.
        </div>
      )}
    </div>
  );
};
