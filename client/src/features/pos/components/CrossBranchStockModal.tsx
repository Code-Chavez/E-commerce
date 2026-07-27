import React, { useEffect, useState } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import { X, Loader2, Building2, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface CrossBranchStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  variantId: number | null;
  variantName: string;
  onSelectBranch?: (branchId: number, branchName: string) => void;
}

interface CrossBranchStockData {
  branchId: number;
  branchName: string;
  quantity: number;
}

export const CrossBranchStockModal: React.FC<CrossBranchStockModalProps> = ({
  isOpen,
  onClose,
  variantId,
  variantName,
  onSelectBranch,
}) => {
  const [data, setData] = useState<CrossBranchStockData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStock = async () => {
    if (!variantId) return;
    setLoading(true);
    setError(null);
    try {
      const { data: res } = await axiosInstance.get(`/v1/pos/stock/cross-branch?variantId=${variantId}`);
      if (res.success) {
        setData(res.data || []);
      } else {
        setError(res.error || 'Error al consultar el stock.');
      }
    } catch (err: any) {
      console.error('Error fetching cross branch stock:', err);
      const errMsg = err.response?.data?.error || 'Error de red al consultar stock entre sucursales.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && variantId) {
      fetchStock();
    } else {
      setData([]);
      setError(null);
    }
  }, [isOpen, variantId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col border border-[#D9D9D2]/30 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D9D9D2]/40 bg-[#F7F7F5]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#D9D9D2]/40 text-[#3F3F3F] rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#3F3F3F] tracking-tight">
                Stock Intersucursal
              </h2>
              <p className="text-[10px] text-[#6B6B6B] font-semibold tracking-wider uppercase mt-0.5">
                Consulta de disponibilidad en sedes activas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#D9D9D2]/40 text-[#6B6B6B] hover:text-[#3F3F3F] rounded-full transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 flex-grow space-y-4">
          <div className="p-3.5 bg-[#F7F7F5] rounded-xl border border-[#D9D9D2]/40">
            <span className="text-[10px] uppercase font-bold text-[#6B6B6B] tracking-wider block mb-0.5">Prenda Seleccionada</span>
            <span className="text-sm font-extrabold text-[#3F3F3F]">{variantName}</span>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#3F3F3F]" />
              <span className="text-xs text-[#6B6B6B] font-semibold">Consultando bases de datos de sedes...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200/50 rounded-xl text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-rose-700 font-bold text-xs">
                <AlertCircle className="w-4.5 h-4.5" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={fetchStock}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-xs font-bold text-rose-700 rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reintentar Consulta</span>
              </button>
            </div>
          ) : data.length === 0 ? (
            <div className="py-10 text-center space-y-2 text-[#6B6B6B]">
              <AlertCircle className="w-8 h-8 mx-auto stroke-[1.5] text-amber-500" />
              <p className="text-xs font-bold text-[#3F3F3F]">Sin disponibilidad externa</p>
              <p className="text-[11px] max-w-xs mx-auto">
                No hay stock registrado de esta prenda en otras sucursales activas del sistema.
              </p>
            </div>
          ) : (
            <div className="border border-[#D9D9D2]/60 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F7F7F5] border-b border-[#D9D9D2]/40 text-[#6B6B6B] font-bold uppercase tracking-wider">
                    <th className="px-4 py-3 font-extrabold">Sucursal</th>
                    <th className="px-4 py-3 text-right font-extrabold">Stock Disponible</th>
                    {onSelectBranch && <th className="px-4 py-3 text-right font-extrabold">Acción</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9D9D2]/20 text-[#3F3F3F]">
                  {data.map((item) => (
                    <tr key={item.branchId} className="hover:bg-[#FAFAFA] transition-colors">
                      <td className="px-4 py-3 font-semibold flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {item.branchName}
                      </td>
                      <td className="px-4 py-3 text-right font-extrabold text-sm">
                        <span className={item.quantity > 0 ? 'text-emerald-700' : 'text-[#6B6B6B]'}>
                          {item.quantity} unds.
                        </span>
                      </td>
                      {onSelectBranch && (
                        <td className="px-4 py-3 text-right">
                          {item.quantity > 0 ? (
                            <button
                              type="button"
                              onClick={() => {
                                onSelectBranch(item.branchId, item.branchName);
                                onClose();
                              }}
                              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] rounded-lg transition-colors cursor-pointer"
                            >
                              Vincular Venta
                            </button>
                          ) : (
                            <span className="text-[10px] text-gray-400 font-bold">Sin Stock</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#D9D9D2]/20 bg-[#FAFAFA]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
