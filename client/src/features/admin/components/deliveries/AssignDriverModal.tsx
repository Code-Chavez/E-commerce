import React, { useState } from 'react';
import type { DeliveryMan } from '../../types/logistics.types';
import { User, X, Loader2 } from 'lucide-react';

interface AssignDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliveryMen: DeliveryMan[];
  onConfirm: (deliveryManId: number) => void;
  isAssigning: boolean;
}

export const AssignDriverModal: React.FC<AssignDriverModalProps> = ({
  isOpen,
  onClose,
  deliveryMen,
  onConfirm,
  isAssigning
}) => {
  const [selectedId, setSelectedId] = useState<number | ''>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedId) {
      onConfirm(Number(selectedId));
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full border border-gray-100 shadow-2xl p-6 relative flex flex-col gap-4 animate-scale-up">
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" />
            <h3 className="font-extrabold text-gray-900 text-lg">Asignar Repartidor</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-black transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-gray-500 font-semibold leading-relaxed">
            Para mover este envío al estado <strong className="text-indigo-600">ASIGNADO</strong>, debes seleccionar un repartidor disponible:
          </p>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-gray-400">Repartidores disponibles</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : '')}
              required
              className="block w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            >
              <option value="">Selecciona un repartidor...</option>
              {deliveryMen.map((men) => (
                <option key={men.id} value={men.id}>
                  {men.name} ({men.email})
                </option>
              ))}
            </select>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!selectedId || isAssigning}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:pointer-events-none rounded-xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/25 transition-all"
            >
              {isAssigning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Asignando...
                </>
              ) : (
                'Asignar y Mover'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
