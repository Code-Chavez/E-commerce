import React, { useEffect, useState } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PriceHistoryUser {
  id: number;
  name: string;
  email: string;
}

interface PriceHistoryEntry {
  id: number;
  variantId: number;
  userId: number | null;
  priceType?: 'SALE' | 'COST';
  oldPrice: number;
  newPrice: number;
  createdAt: string;
  user: PriceHistoryUser | null;
}

interface PriceHistoryProps {
  productId: number;
}

export const PriceHistory: React.FC<PriceHistoryProps> = ({ productId }) => {
  const [history, setHistory] = useState<PriceHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setError(false);
        const res = await axiosInstance.get(`/v1/products/${productId}/price-history`);
        setHistory(res.data.data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [productId]);

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center text-red-500 text-sm">
        Error al cargar el historial de precios.
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500 text-sm">
        No hay registros de cambios de precio para este producto.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[#D9D9D2]/40 text-[#6B6B6B] text-xs font-bold uppercase tracking-wider">
            <th className="py-3 px-4">Fecha</th>
            <th className="py-3 px-4">Variante ID</th>
            <th className="py-3 px-4">Tipo</th>
            <th className="py-3 px-4">Precio Anterior</th>
            <th className="py-3 px-4">Nuevo Precio</th>
            <th className="py-3 px-4">Usuario</th>
          </tr>
        </thead>
        <tbody>
          {history.map((entry) => (
            <tr key={entry.id} className="border-b border-[#D9D9D2]/20 hover:bg-[#F9F9F9]/50 transition-colors">
              <td className="py-3 px-4 text-sm text-[#3F3F3F]">
                {format(new Date(entry.createdAt), "dd MMM yyyy, HH:mm", { locale: es })}
              </td>
              <td className="py-3 px-4 text-sm text-[#3F3F3F]">
                #{entry.variantId}
              </td>
              <td className="py-3 px-4">
                {entry.priceType === 'COST' ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                    Costo
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
                    Venta
                  </span>
                )}
              </td>
              <td className="py-3 px-4 text-sm text-[#6B6B6B] line-through">
                S/ {entry.oldPrice?.toFixed(2)}
              </td>
              <td className="py-3 px-4 text-sm font-semibold text-[#3F3F3F]">
                S/ {entry.newPrice?.toFixed(2)}
              </td>
              <td className="py-3 px-4 text-sm text-[#6B6B6B]">
                {entry.user?.name ?? 'Sistema'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
