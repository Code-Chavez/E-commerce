import React, { useState, useEffect } from 'react';
import { X, Loader2, FileText, FileSpreadsheet, Table, Calendar } from 'lucide-react';
import { reportService } from '../api/reportService';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'sales' | 'inventory' | 'clients';
  defaultFrom?: string;
  defaultTo?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  type,
  defaultFrom = '',
  defaultTo = '',
}) => {
  if (!isOpen) return null;

  const [format, setFormat] = useState<'pdf' | 'excel' | 'csv'>('excel');
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFrom(defaultFrom);
    setTo(defaultTo);
  }, [defaultFrom, defaultTo, isOpen]);

  const reportNames: Record<typeof type, string> = {
    sales: 'Reporte de Ventas (E-commerce + POS)',
    inventory: 'Reporte de Stock e Inventario',
    clients: 'Reporte de Base de Clientes',
  };

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setExporting(true);
    setError(null);
    try {
      await reportService.exportReport({
        type,
        format,
        from: type !== 'inventory' && from ? from : undefined,
        to: type !== 'inventory' && to ? to : undefined,
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('Ocurrió un error al generar el reporte. Por favor, intenta de nuevo.');
    } finally {
      setExporting(false);
    }
  };

  const supportsDates = type !== 'inventory';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-[#D9D9D2]/40"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#D9D9D2]/40 flex justify-between items-center bg-[#FAFAFA]">
          <div>
            <h2 className="text-lg font-bold text-[#3F3F3F]">Exportar Reporte</h2>
            <p className="text-xs text-[#6B6B6B] font-semibold mt-0.5">{reportNames[type]}</p>
          </div>
          <button 
            onClick={onClose} 
            disabled={exporting}
            className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleExport} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
              {error}
            </div>
          )}

          {/* Format Selection Card list */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
              1. Selecciona el Formato
            </label>
            <div className="grid grid-cols-3 gap-3">
              {/* Excel Card */}
              <button
                type="button"
                onClick={() => setFormat('excel')}
                disabled={exporting}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                  format === 'excel'
                    ? 'border-[#3F3F3F] bg-[#3F3F3F]/5 text-[#3F3F3F] font-bold shadow-sm'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-800'
                } disabled:opacity-50`}
              >
                <FileSpreadsheet className={`w-8 h-8 ${format === 'excel' ? 'text-[#3F3F3F]' : 'text-gray-400'}`} />
                <span className="text-xs">Excel</span>
              </button>

              {/* PDF Card */}
              <button
                type="button"
                onClick={() => setFormat('pdf')}
                disabled={exporting}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                  format === 'pdf'
                    ? 'border-[#3F3F3F] bg-[#3F3F3F]/5 text-[#3F3F3F] font-bold shadow-sm'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-800'
                } disabled:opacity-50`}
              >
                <FileText className={`w-8 h-8 ${format === 'pdf' ? 'text-[#3F3F3F]' : 'text-gray-400'}`} />
                <span className="text-xs">PDF</span>
              </button>

              {/* CSV Card */}
              <button
                type="button"
                onClick={() => setFormat('csv')}
                disabled={exporting}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                  format === 'csv'
                    ? 'border-[#3F3F3F] bg-[#3F3F3F]/5 text-[#3F3F3F] font-bold shadow-sm'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-800'
                } disabled:opacity-50`}
              >
                <Table className={`w-8 h-8 ${format === 'csv' ? 'text-[#3F3F3F]' : 'text-gray-400'}`} />
                <span className="text-xs">CSV</span>
              </button>
            </div>
          </div>

          {/* Date Filtering (If supported) */}
          {supportsDates ? (
            <div className="space-y-2.5 pt-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                2. Rango de Fechas (Opcional)
              </label>
              <div className="grid grid-cols-2 gap-4">
                {/* Date From */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Desde
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="date"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      disabled={exporting}
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/20 text-[#3F3F3F] disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Date To */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Hasta
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="date"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      disabled={exporting}
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/20 text-[#3F3F3F] disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 italic">
                * Si se dejan las fechas vacías, se exportarán todos los registros disponibles en la base de datos.
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-xs text-gray-500 leading-relaxed">
              El reporte de stock e inventario consolidará la situación actual de todas las existencias y variantes físicas en tiempo real para todas las sucursales del negocio.
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-4 flex justify-end gap-3 border-t border-[#D9D9D2]/40 bg-[#FAFAFA] -mx-6 -mb-6 p-4">
            <button
              type="button"
              onClick={onClose}
              disabled={exporting}
              className="px-4 py-2 border border-[#D9D9D2] hover:bg-gray-50 text-[#3F3F3F] font-bold rounded-xl transition-all duration-200 text-sm disabled:opacity-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={exporting}
              className="px-5 py-2 bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 text-[#F7F7F5] font-bold rounded-xl transition-all duration-200 text-sm flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generando...
                </>
              ) : (
                'Exportar Reporte'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
