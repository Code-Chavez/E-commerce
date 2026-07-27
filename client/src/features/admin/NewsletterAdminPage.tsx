import React from 'react';
import { 
  Mail, 
  Download, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle,
  Calendar,
  CheckCircle,
  Inbox
} from 'lucide-react';
import { useNewsletterSubscribers } from './hooks/useNewsletterSubscribers';

export const NewsletterAdminPage: React.FC = () => {
  const {
    subscribers,
    loading,
    error,
    page,
    setPage,
    total,
    totalPages,
    isExporting,
    refresh,
    exportData,
  } = useNewsletterSubscribers();

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#3F3F3F] flex items-center gap-2">
            <Mail className="w-8 h-8 text-[#3F3F3F]" />
            Suscriptores al Newsletter
            {total > 0 && (
              <span className="ml-2 text-xs font-bold bg-brand-primary/20 text-[#3F3F3F] px-2.5 py-1 rounded-full border border-brand-accent/10">
                {total} activos
              </span>
            )}
          </h1>
          <p className="text-[#3F3F3F]/60 mt-1">
            Visualiza y exporta la lista de usuarios que se han suscrito al boletín informativo desde la tienda E-commerce.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => exportData('csv')}
            disabled={loading || isExporting || subscribers.length === 0}
            className="px-4 py-2 bg-white border border-[#D9D9D2] hover:bg-[#FAFAFA] text-[#3F3F3F] font-bold rounded-xl transition-all shadow-sm text-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>Exportar CSV</span>
          </button>
          
          <button
            onClick={() => exportData('excel')}
            disabled={loading || isExporting || subscribers.length === 0}
            className="px-4 py-2 bg-white border border-[#D9D9D2] hover:bg-[#FAFAFA] text-[#3F3F3F] font-bold rounded-xl transition-all shadow-sm text-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-red-800">Error al Cargar Suscriptores</h3>
            <p className="text-xs text-red-700 mt-1">{error}</p>
            <button
              onClick={refresh}
              className="mt-3 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 font-bold rounded-lg text-xs transition-colors cursor-pointer"
            >
              Reintentar Carga
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {!error && (
        <div className="bg-white rounded-2xl border border-[#D9D9D2]/40 shadow-sm overflow-hidden">
          {loading ? (
            /* Loading skeletons matching table structure */
            <div className="p-6 space-y-4">
              <div className="h-8 bg-gray-100 rounded animate-pulse w-1/4"></div>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-50 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          ) : subscribers.length === 0 ? (
            /* Empty State */
            <div className="p-12 flex flex-col items-center justify-center min-h-[300px]">
              <Inbox className="w-12 h-12 text-[#6B6B6B]/40 mb-3" />
              <h3 className="text-sm font-bold text-[#3F3F3F]">Sin Suscriptores</h3>
              <p className="text-xs text-[#6B6B6B] mt-1">
                Aún no hay usuarios suscritos de forma activa al newsletter.
              </p>
            </div>
          ) : (
            /* Subscribers Table */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#D9D9D2]/30 bg-gray-50 text-[10px] uppercase font-bold tracking-wider text-[#6B6B6B]">
                    <th className="px-6 py-4 w-16">#</th>
                    <th className="px-6 py-4">Correo Electrónico</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4">Fecha de Suscripción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9D9D2]/20 text-sm text-[#3F3F3F]">
                  {subscribers.map((sub, index) => {
                    const rowNumber = (page - 1) * 10 + index + 1;
                    return (
                      <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-[#6B6B6B]">{rowNumber}</td>
                        <td className="px-6 py-4 font-semibold">{sub.email}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            Activo
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[#6B6B6B]">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-[#6B6B6B]/60" />
                            {new Date(sub.subscribedAt).toLocaleString('es-PE', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination Section */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-[#D9D9D2]/20 flex items-center justify-between bg-gray-50/30">
                  <span className="text-xs text-[#6B6B6B] font-semibold">
                    Mostrando {(page - 1) * 10 + 1} - {Math.min(page * 10, total)} de {total} suscriptores
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevPage}
                      disabled={page === 1}
                      className="p-1.5 border border-[#D9D9D2] hover:bg-white rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Página anterior"
                    >
                      <ChevronLeft className="w-4 h-4 text-[#3F3F3F]" />
                    </button>
                    <span className="text-xs font-bold text-[#3F3F3F]">
                      Página {page} de {totalPages}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={page === totalPages}
                      className="p-1.5 border border-[#D9D9D2] hover:bg-white rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Página siguiente"
                    >
                      <ChevronRight className="w-4 h-4 text-[#3F3F3F]" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NewsletterAdminPage;
