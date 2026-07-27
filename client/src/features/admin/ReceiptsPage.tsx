import React, { useEffect, useState } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';
import { 
  FileText, 
  Printer, 
  Download, 
  Calendar, 
  Filter, 
  Loader2, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';

interface BranchOption {
  id: number;
  name: string;
}

interface ReceiptResult {
  orderId: number;
  status: string;
  subtotal: number | string;
  discountTotal: number | string;
  total: number | string;
  isCrossBranch: boolean;
  sourceBranch?: {
    id: number;
    name: string;
  };
  branch: {
    id: number;
    name: string;
  };
  createdAt: string;
  seller: {
    id: number;
    name: string;
    lastName: string;
    email: string;
  };
  client?: {
    id: number;
    name: string;
    lastName: string;
    documentId: string;
  };
  documentType?: string;
  series?: string | null;
  correlative?: number | null;
}

export const ReceiptsPage: React.FC = () => {
  useDocumentTitle('Consulta de Comprobantes - D\'Mendoza');

  // Filter States
  const [branchId, setBranchId] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);

  // Data States
  const [receipts, setReceipts] = useState<ReceiptResult[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Action States
  const [printingId, setPrintingId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const fetchBranches = async () => {
    try {
      const { data } = await axiosInstance.get('/v1/branches');
      if (data.success) {
        setBranches((data.data || []).filter((b: any) => b.isActive));
      }
    } catch (err) {
      console.error('Error loading branches:', err);
    }
  };

  const fetchReceipts = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (branchId) queryParams.append('branchId', branchId);
      if (type) queryParams.append('type', type);
      if (from) queryParams.append('from', from);
      if (to) queryParams.append('to', to);
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());

      const { data } = await axiosInstance.get(`/v1/receipts?${queryParams.toString()}`);
      if (data.success) {
        setReceipts(data.data.results || []);
        setTotal(data.data.total || 0);
        setTotalPages(data.data.totalPages || 1);
      } else {
        setError(data.error || 'Error al obtener los comprobantes.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error de red al consultar comprobantes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchReceipts();
  }, [branchId, type, from, to, page]);

  const handleReprint = async (orderId: number) => {
    setPrintingId(orderId);
    try {
      const response = await axiosInstance.get(`/v1/receipts/${orderId}/pdf?format=ticket`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const win = window.open(url, '_blank');
      if (win) win.focus();
      setTimeout(() => URL.revokeObjectURL(url), 15000);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al reimprimir el comprobante.');
    } finally {
      setPrintingId(null);
    }
  };

  const handleDownloadPDF = async (orderId: number) => {
    setDownloadingId(orderId);
    try {
      const response = await axiosInstance.get(`/v1/receipts/${orderId}/pdf`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `comprobante-${orderId}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al generar el PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  const clearFilters = () => {
    setBranchId('');
    setType('');
    setFrom('');
    setTo('');
    setPage(1);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#D9D9D2]/40 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#3F3F3F]/80 uppercase tracking-widest mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#3F3F3F]" />
              <span>Personal Administrativo</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#3F3F3F] tracking-tight flex items-center gap-2">
              Consulta de Comprobantes
            </h1>
            <p className="text-sm text-[#6B6B6B] mt-1">
              Busca, filtra, reimprime y exporta comprobantes electrónicos del sistema de ventas.
            </p>
          </div>
        </div>

        {/* Filter Panel */}
        <div className="bg-white p-5 rounded-2xl border border-[#D9D9D2]/50 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#3F3F3F] uppercase tracking-wider">
            <Filter className="w-4 h-4 text-[#6B6B6B]" />
            <span>Filtros de Búsqueda</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Branch Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider block">Sucursal Emisora</label>
              <select
                value={branchId}
                onChange={(e) => { setBranchId(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 bg-[#F7F7F5] border border-[#D9D9D2]/80 rounded-xl text-xs font-bold text-[#3F3F3F] outline-none"
              >
                <option value="">Todas las Sucursales</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider block">Tipo de Venta</label>
              <select
                value={type}
                onChange={(e) => { setType(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 bg-[#F7F7F5] border border-[#D9D9D2]/80 rounded-xl text-xs font-bold text-[#3F3F3F] outline-none"
              >
                <option value="">Todos los Tipos</option>
                <option value="normal">Venta Local (Normal)</option>
                <option value="cross-branch">Venta Intersucursal (Cross-Branch)</option>
              </select>
            </div>

            {/* Date From */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider block">Desde (Fecha)</label>
              <div className="relative">
                <input
                  type="date"
                  value={from}
                  onChange={(e) => { setFrom(e.target.value); setPage(1); }}
                  className="w-full pl-8 pr-3 py-2 bg-[#F7F7F5] border border-[#D9D9D2]/80 rounded-xl text-xs font-bold text-[#3F3F3F] outline-none"
                />
                <Calendar className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#6B6B6B]" />
              </div>
            </div>

            {/* Date To */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider block">Hasta (Fecha)</label>
              <div className="relative">
                <input
                  type="date"
                  value={to}
                  onChange={(e) => { setTo(e.target.value); setPage(1); }}
                  className="w-full pl-8 pr-3 py-2 bg-[#F7F7F5] border border-[#D9D9D2]/80 rounded-xl text-xs font-bold text-[#3F3F3F] outline-none"
                />
                <Calendar className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#6B6B6B]" />
              </div>
            </div>

          </div>

          <div className="flex justify-end pt-2 border-t border-[#D9D9D2]/20">
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-[#F7F7F5] hover:bg-[#EBEBE8] text-[#3F3F3F] font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-[#D9D9D2]"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>

        {/* Results Area */}
        {loading && receipts.length === 0 ? (
          <div className="bg-white p-20 border border-[#D9D9D2]/50 rounded-2xl text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#3F3F3F] mb-3" />
            <span className="text-xs text-[#6B6B6B] font-semibold">Cargando comprobantes...</span>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
            <button onClick={fetchReceipts} className="text-red-700 hover:text-red-900">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        ) : receipts.length === 0 ? (
          <div className="bg-white p-16 border border-[#D9D9D2]/50 rounded-2xl text-center space-y-3">
            <FileText className="w-12 h-12 text-[#6B6B6B]/40 mx-auto" />
            <h3 className="text-base font-bold text-[#3F3F3F]">Sin Comprobantes</h3>
            <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto">
              No se encontraron transacciones o comprobantes que coincidan con los criterios seleccionados.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-[#D9D9D2]/50 rounded-2xl overflow-hidden shadow-sm space-y-4">
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-[#F7F7F5] text-[#6B6B6B] border-b border-[#D9D9D2]/40 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">N° Pedido</th>
                    <th className="px-5 py-3.5">Fecha</th>
                    <th className="px-5 py-3.5">Sucursal Emisora</th>
                    <th className="px-5 py-3.5">Cliente</th>
                    <th className="px-5 py-3.5">Vendedor</th>
                    <th className="px-5 py-3.5 text-right">Monto Total</th>
                    <th className="px-5 py-3.5 text-center">Tipo</th>
                    <th className="px-5 py-3.5 text-center">Estado</th>
                    <th className="px-5 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9D9D2]/20 text-[#3F3F3F]">
                  {receipts.map((row) => (
                    <tr key={row.orderId} className="hover:bg-[#FAFAFA] transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-extrabold text-[#9B9B94] uppercase tracking-wider">
                            {row.documentType || 'TICKET'}
                          </span>
                          <span className="font-bold text-[#3F3F3F]">
                            {(row.series && row.correlative) 
                              ? `${row.series}-${row.correlative.toString().padStart(6, '0')}`
                              : `#${row.orderId.toString().padStart(6, '0')}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[#6B6B6B]">
                        {new Date(row.createdAt).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td className="px-5 py-4 font-semibold">
                        {row.branch.name}
                      </td>
                      <td className="px-5 py-4">
                        {row.client ? (
                          <div className="flex flex-col">
                            <span className="font-semibold">{row.client.name} {row.client.lastName}</span>
                            <span className="text-[10px] text-[#6B6B6B] font-mono">{row.client.documentId}</span>
                          </div>
                        ) : (
                          <span className="text-[#6B6B6B] italic">Sin Registrar</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-medium">{row.seller.name} {row.seller.lastName}</span>
                      </td>
                      <td className="px-5 py-4 font-black text-right text-sm">
                        S/. {Number(row.total).toFixed(2)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded font-extrabold uppercase text-[9px] tracking-wider border ${
                          row.isCrossBranch 
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                            : 'bg-gray-50 border-gray-200 text-gray-700'
                        }`}>
                          {row.isCrossBranch ? 'Cross-Branch' : 'Normal'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                          row.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                          row.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {row.status === 'COMPLETED' ? 'Completado' : row.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleReprint(row.orderId)}
                            disabled={printingId === row.orderId}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-[#D9D9D2] hover:bg-[#FAFAFA] text-[#3F3F3F] text-[10px] font-bold rounded-lg cursor-pointer transition-all"
                            title="Reimprimir Comprobante"
                          >
                            {printingId === row.orderId ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Printer className="w-3 h-3" />
                            )}
                            <span>Reimprimir</span>
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(row.orderId)}
                            disabled={downloadingId === row.orderId}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#3F3F3F] hover:bg-black text-white text-[10px] font-bold rounded-lg cursor-pointer transition-all disabled:opacity-50"
                            title="Descargar PDF del comprobante"
                          >
                            {downloadingId === row.orderId ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Download className="w-3 h-3" />
                            )}
                            <span>PDF</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-[#D9D9D2]/30 bg-[#F7F7F5]">
                <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
                  Total: {total} Comprobantes
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="p-1.5 bg-white border border-[#D9D9D2] hover:bg-[#FAFAFA] text-[#3F3F3F] rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-[#3F3F3F] px-2">
                    Página {page} de {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages}
                    className="p-1.5 bg-white border border-[#D9D9D2] hover:bg-[#FAFAFA] text-[#3F3F3F] rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>
        )}
      </div>

    </div>
  );
};

export default ReceiptsPage;
