import React from 'react';
import { Calendar, RefreshCw } from 'lucide-react';

interface DashboardFiltersProps {
  fromDate: string;
  toDate: string;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
  onApply: () => void;
  loading: boolean;
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onApply,
  loading
}) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 mb-6">
      <div className="flex flex-col md:flex-row items-end gap-4">
        <div className="w-full md:w-1/3">
          <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
            Fecha Desde
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => onFromDateChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:border-brand-accent focus:ring-1 focus:ring-brand-accent outline-none transition-all"
            />
          </div>
        </div>

        <div className="w-full md:w-1/3">
          <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
            Fecha Hasta
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={toDate}
              onChange={(e) => onToDateChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:border-brand-accent focus:ring-1 focus:ring-brand-accent outline-none transition-all"
            />
          </div>
        </div>

        <div className="w-full md:w-1/3">
          <button
            onClick={onApply}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-brand-accent hover:bg-brand-accent-hover text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              'Aplicar Filtros'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
