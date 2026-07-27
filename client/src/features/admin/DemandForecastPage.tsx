import React, { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, Download, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { forecastService } from './services/forecastService';
import type { DemandForecastItem, RestockSuggestionItem } from './types/forecast.types';
import { DemandForecastTable } from './components/reports/DemandForecastTable';
import { RestockSuggestionsTable } from './components/reports/RestockSuggestionsTable';
import { exportRestockSuggestionsToCSV } from './utils/csvExport';

export const DemandForecastPage: React.FC = () => {
  const [months, setMonths] = useState<string>('1');
  const [currentMonths, setCurrentMonths] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [forecastItems, setForecastItems] = useState<DemandForecastItem[]>([]);
  const [suggestionItems, setSuggestionItems] = useState<RestockSuggestionItem[]>([]);

  const fetchReports = async (targetMonths: number) => {
    setIsLoading(true);
    setCurrentMonths(targetMonths);
    try {
      const [forecastRes, suggestionsRes] = await Promise.all([
        forecastService.getDemandForecast(targetMonths),
        forecastService.getRestockSuggestions(targetMonths)
      ]);

      if (forecastRes.success && suggestionsRes.success) {
        setForecastItems(forecastRes.data);
        setSuggestionItems(suggestionsRes.data);
        toast.success(`Datos cargados exitosamente usando ${targetMonths} mes(es) de historial`);
      } else {
        toast.error('Ocurrió un error al cargar uno de los reportes');
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.message || 'Error de red';
      toast.error(`Error: ${errMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(1);
  }, []);

  const handleFetchForecast = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(months, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      fetchReports(parsed);
    } else {
      toast.error('Por favor, ingresa un número de meses válido (mayor o igual a 1)');
    }
  };

  const handleReset = () => {
    setMonths('1');
    fetchReports(1);
  };

  const handleExportCSV = () => {
    exportRestockSuggestionsToCSV(suggestionItems, currentMonths);
    toast.success('Sugerencias exportadas a CSV exitosamente');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#3F3F3F] flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-[#3F3F3F]" />
            Modelo de Predicción de Demanda
          </h1>
          <p className="text-[#3F3F3F]/60 mt-1">
            Analiza la demanda proyectada y sugerencias de abastecimiento basadas en el promedio móvil histórico de los últimos {currentMonths} mes(es).
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={isLoading || suggestionItems.length === 0}
          className="px-5 py-2.5 bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 text-[#F7F7F5] font-bold rounded-xl transition-all shadow-md text-sm cursor-pointer disabled:opacity-50 flex items-center gap-2 self-start md:self-auto"
        >
          <Download className="w-4 h-4" />
          Exportar Sugerencias
        </button>
      </div>

      {/* Filters Base Structure */}
      <form 
        onSubmit={handleFetchForecast} 
        className="bg-white p-5 rounded-2xl border border-[#D9D9D2]/40 shadow-sm flex flex-wrap items-end gap-4"
      >
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="months-input" className="block text-xs font-extrabold text-[#6B6B6B] uppercase tracking-wider mb-2">
            Periodo Histórico a Evaluar (Meses)
          </label>
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 flex items-center gap-2">
            <input
              id="months-input"
              type="number"
              min="1"
              value={months}
              onChange={(e) => setMonths(e.target.value)}
              disabled={isLoading}
              className="bg-transparent border-none focus:ring-0 w-full text-sm text-[#3F3F3F] outline-none font-semibold"
              placeholder="Ej. 1"
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
            <RefreshCw className="w-4 h-4" />
            Restablecer
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2 bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 text-[#F7F7F5] font-bold rounded-xl transition-all shadow-md text-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            Generar Reporte
          </button>
        </div>
      </form>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-[#D9D9D2]/40 shadow-sm p-12 flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 text-[#3F3F3F] animate-spin mb-4" />
          <h3 className="text-sm font-bold text-[#3F3F3F]">Generando proyecciones de demanda...</h3>
          <p className="text-xs text-[#6B6B6B] mt-1">
            Procesando historial de movimientos de salida en el Kardex y stock disponible en sucursales.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-[#3F3F3F] mb-4">Tabla de Predicción de Demanda</h2>
            <DemandForecastTable items={forecastItems} />
          </div>

          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-[#3F3F3F] mb-4">Sugerencias de Abastecimiento</h2>
            <RestockSuggestionsTable items={suggestionItems} />
          </div>
        </div>
      )}
    </div>
  );
};

export default DemandForecastPage;
