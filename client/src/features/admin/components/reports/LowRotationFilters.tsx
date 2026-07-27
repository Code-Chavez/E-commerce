import React, { useState } from 'react';
import { Search, RotateCcw } from 'lucide-react';

interface LowRotationFiltersProps {
  onSearch: (days: number) => void;
  isLoading: boolean;
  defaultDays?: number;
}

export const LowRotationFilters: React.FC<LowRotationFiltersProps> = ({ 
  onSearch, 
  isLoading,
  defaultDays = 90
}) => {
  const [days, setDays] = useState<string>(String(defaultDays));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(days, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      onSearch(parsed);
    }
  };

  const handleReset = () => {
    setDays(String(defaultDays));
    onSearch(defaultDays);
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="bg-white p-5 rounded-2xl border border-[#D9D9D2]/40 shadow-sm flex flex-wrap items-end gap-4"
    >
      <div className="flex-1 min-w-[200px]">
        <label htmlFor="days-input" className="block text-xs font-extrabold text-[#6B6B6B] uppercase tracking-wider mb-2">
          Periodo sin Venta (en Días)
        </label>
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 flex items-center gap-2">
          <input
            id="days-input"
            type="number"
            min="1"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            disabled={isLoading}
            className="bg-transparent border-none focus:ring-0 w-full text-sm text-[#3F3F3F] outline-none font-semibold"
            placeholder="Ej. 90"
            required
          />
        </div>
      </div>

      <div className="flex gap-2 shrink-0">
        <button
          type="button"
          onClick={handleReset}
          disabled={isLoading}
          className="px-4 py-2 border border-gray-200 text-gray-500 hover:bg-gray-50 font-bold rounded-xl transition-all text-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Restablecer
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2 bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 text-[#F7F7F5] font-bold rounded-xl transition-all shadow-md text-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          Generar Reporte
        </button>
      </div>
    </form>
  );
};
