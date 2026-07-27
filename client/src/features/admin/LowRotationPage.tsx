import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { lowRotationService } from './services/lowRotationService';
import type { LowRotationItem } from './types/lowRotation.types';
import { LowRotationFilters } from './components/reports/LowRotationFilters';
import { LowRotationTable } from './components/reports/LowRotationTable';
import { exportLowRotationToCSV } from './utils/csvExport';

export const LowRotationPage: React.FC = () => {
  const [items, setItems] = useState<LowRotationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentDays, setCurrentDays] = useState<number>(90);

  const fetchReport = async (days: number) => {
    setIsLoading(true);
    setCurrentDays(days);
    try {
      const response = await lowRotationService.getLowRotation(days);
      if (response.success) {
        setItems(response.data);
        toast.success(`Reporte generado para ${days} días sin venta`);
      } else {
        toast.error('No se pudo generar el reporte');
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
    fetchReport(90);
  }, []);

  const handleExportCSV = () => {
    exportLowRotationToCSV(items, currentDays);
    toast.success('Reporte exportado a CSV exitosamente');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#3F3F3F] flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-[#3F3F3F]" />
            Productos con Baja Rotación
          </h1>
          <p className="text-[#3F3F3F]/60 mt-1">
            Identifica variantes de productos que no registran salidas en el Kardex para optimizar tu inventario.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={isLoading || items.length === 0}
          className="px-5 py-2.5 bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 text-[#F7F7F5] font-bold rounded-xl transition-all shadow-md text-sm cursor-pointer disabled:opacity-50 flex items-center gap-2 self-start md:self-auto"
        >
          <Download className="w-4 h-4" />
          Exportar a CSV
        </button>
      </div>

      {/* Filters */}
      <LowRotationFilters 
        onSearch={fetchReport} 
        isLoading={isLoading} 
        defaultDays={currentDays}
      />

      {/* Main Content Area */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-[#D9D9D2]/40 shadow-sm p-12 flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 text-[#3F3F3F] animate-spin mb-4" />
          <h3 className="text-sm font-bold text-[#3F3F3F]">Cargando reporte analítico...</h3>
          <p className="text-xs text-[#6B6B6B] mt-1">
            Procesando registros de Kardex e inventario de sucursales. Esto puede tomar unos segundos.
          </p>
        </div>
      ) : (
        <LowRotationTable items={items} />
      )}
    </div>
  );
};

export default LowRotationPage;
