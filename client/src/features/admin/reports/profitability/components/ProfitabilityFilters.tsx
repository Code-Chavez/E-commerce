import React from 'react';
import type { GroupByOption } from '../../../types/profitability';
import { Calendar, Filter } from 'lucide-react';

interface ProfitabilityFiltersProps {
  fromDate: string;
  toDate: string;
  groupBy: GroupByOption;
  onFromDateChange: (val: string) => void;
  onToDateChange: (val: string) => void;
  onGroupByChange: (val: GroupByOption) => void;
  onApply: () => void;
  loading: boolean;
}

export const ProfitabilityFilters: React.FC<ProfitabilityFiltersProps> = ({
  fromDate,
  toDate,
  groupBy,
  onFromDateChange,
  onToDateChange,
  onGroupByChange,
  onApply,
  loading,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 mb-6">
      <div className="flex flex-col lg:flex-row items-center gap-4">
        {/* Agrupación */}
        <div className="w-full lg:w-1/4">
          <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
            Agrupar por
          </label>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={groupBy}
              onChange={(e) => onGroupByChange(e.target.value as GroupByOption)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:border-brand-accent focus:ring-1 focus:ring-brand-accent outline-none appearance-none bg-white transition-all"
            >
              <option value="brand">Marca</option>
              <option value="category">Categoría</option>
            </select>
          </div>
        </div>

        {/* Fecha Desde */}
        <div className="w-full lg:w-1/4">
          <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
            Desde
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

        {/* Fecha Hasta */}
        <div className="w-full lg:w-1/4">
          <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
            Hasta
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

        {/* Botón Aplicar */}
        <div className="w-full lg:w-1/4 flex items-end">
          <button
            onClick={onApply}
            disabled={loading}
            className="w-full h-[42px] mt-auto bg-brand-accent hover:bg-brand-accent/90 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Consultando...' : 'Aplicar Filtros'}
          </button>
        </div>
      </div>
    </div>
  );
};
