import React, { useState, useEffect } from 'react';
import type { InventorySettings, ValuationMethod } from '../types/kardex.types';
import { X, Settings2, ShieldAlert, Loader2 } from 'lucide-react';

interface InventorySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: InventorySettings | null;
  loading: boolean;
  updating: boolean;
  onSave: (method: ValuationMethod) => Promise<boolean>;
}

export const InventorySettingsModal: React.FC<InventorySettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  loading,
  updating,
  onSave,
}) => {
  const [method, setMethod] = useState<ValuationMethod>('PROMEDIO_PONDERADO');

  useEffect(() => {
    if (settings) {
      setMethod(settings.valuationMethod);
    }
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onSave(method);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#D9D9D2] max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#EBEBE8] bg-[#FAFAFA]">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-[#3F3F3F]" />
            <h3 className="font-extrabold text-[#3F3F3F] text-sm uppercase tracking-wider">
              Valorización de Inventario
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-4">
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-6 space-y-2">
                <Loader2 className="w-6 h-6 text-[#3F3F3F] animate-spin" />
                <span className="text-xs text-[#6B6B6B]">Obteniendo configuración actual...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-[#6B6B6B] leading-relaxed">
                  Selecciona el método de valorización de inventario que aplicará a los egresos (salidas de stock) del sistema.
                </p>

                <div className="space-y-3">
                  {/* CPP */}
                  <label className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    method === 'PROMEDIO_PONDERADO'
                      ? 'border-[#3F3F3F] bg-[#FAFAFA]'
                      : 'border-[#EBEBE8] hover:border-[#D9D9D2]'
                  }`}>
                    <input
                      type="radio"
                      name="valuationMethod"
                      value="PROMEDIO_PONDERADO"
                      checked={method === 'PROMEDIO_PONDERADO'}
                      onChange={() => setMethod('PROMEDIO_PONDERADO')}
                      className="mt-0.5 accent-[#3F3F3F]"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#3F3F3F]">
                        Costo Promedio Ponderado (CPP)
                      </span>
                      <span className="text-[10px] text-[#6B6B6B] mt-0.5">
                        El costo unitario de salida es el promedio de los costos de compras existentes.
                      </span>
                    </div>
                  </label>

                  {/* PEPS */}
                  <label className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    method === 'PEPS'
                      ? 'border-[#3F3F3F] bg-[#FAFAFA]'
                      : 'border-[#EBEBE8] hover:border-[#D9D9D2]'
                  }`}>
                    <input
                      type="radio"
                      name="valuationMethod"
                      value="PEPS"
                      checked={method === 'PEPS'}
                      onChange={() => setMethod('PEPS')}
                      className="mt-0.5 accent-[#3F3F3F]"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#3F3F3F]">
                        PEPS (Primero en Entrar, Primero en Salir)
                      </span>
                      <span className="text-[10px] text-[#6B6B6B] mt-0.5">
                        Las salidas se valorizan según los costos más antiguos de ingresos de stock disponibles (FIFO).
                      </span>
                    </div>
                  </label>
                </div>

                {/* Advertencia de Auditoria */}
                <div className="flex gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="flex flex-col text-[10px] text-amber-800 leading-relaxed font-semibold">
                    <span>¡Importante!</span>
                    <span className="font-normal mt-0.5">
                      El cambio del método de valorización aplica únicamente a transacciones y salidas futuras. El historial existente no se recalculará para mantener la integridad histórica del Kardex.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 p-3 bg-[#FAFAFA] border-t border-[#EBEBE8]">
            <button
              type="button"
              onClick={onClose}
              disabled={updating}
              className="px-3 py-1.5 border border-[#D9D9D2] text-[#3F3F3F] text-xs font-bold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={updating || loading}
              className="px-4 py-1.5 bg-black text-white text-xs font-extrabold uppercase tracking-wide rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {updating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Guardar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
