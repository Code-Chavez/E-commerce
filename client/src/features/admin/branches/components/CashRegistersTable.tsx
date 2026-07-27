import React from 'react';
import { Landmark, Calendar, Trash2, Edit3, Sparkles } from 'lucide-react';
import type { CashRegister } from '../hooks/useCashRegisters';

interface CashRegistersTableProps {
  registers: CashRegister[];
  loading: boolean;
  onEdit: (register: CashRegister) => void;
  onDelete: (id: number) => void;
}

export const CashRegistersTable: React.FC<CashRegistersTableProps> = ({
  registers,
  loading,
  onEdit,
  onDelete,
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-[#D9D9D2]/40 shadow-sm">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-[#D9D9D2] opacity-25"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-[#3F3F3F] animate-spin"></div>
        </div>
        <p className="mt-4 text-sm text-[#6B6B6B] font-medium tracking-wide">Cargando cajas registradoras...</p>
      </div>
    );
  }

  if (registers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 bg-white rounded-2xl border border-[#D9D9D2]/40 shadow-sm text-center">
        <div className="p-4 bg-[#F7F7F5] rounded-full text-[#6B6B6B] mb-4">
          <Landmark className="w-10 h-10 stroke-[1.5]" />
        </div>
        <h3 className="text-lg font-semibold text-[#3F3F3F]">Sin cajas registradoras</h3>
        <p className="text-sm text-[#6B6B6B] max-w-sm mt-1">
          No hay cajas registradoras en esta sucursal o registradas en el sistema. Crea una para habilitar las ventas.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#D9D9D2]/50 overflow-hidden transition-all duration-300 hover:shadow-md">
      {/* Desktop view */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F7F7F5] border-b border-[#D9D9D2]/40 text-[#3F3F3F] text-xs font-semibold uppercase tracking-wider">
              <th className="px-6 py-4">Caja Registradora</th>
              <th className="px-6 py-4">Sucursal Vinculada</th>
              <th className="px-6 py-4">Fecha de Alta</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D9D9D2]/20">
            {registers.map((reg) => (
              <tr 
                key={reg.id} 
                className="hover:bg-[#F7F7F5]/40 transition-colors duration-200 group"
              >
                {/* Core register info */}
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#F7F7F5] text-[#3F3F3F] rounded-xl border border-[#D9D9D2]/30 group-hover:scale-105 transition-transform duration-200">
                      <Landmark className="w-5 h-5 stroke-[1.8]" />
                    </div>
                    <div>
                      <div className="font-semibold text-[#3F3F3F] text-base">{reg.name}</div>
                      <div className="text-xs text-[#6B6B6B] mt-0.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#3F3F3F]/60" />
                        <span>ID Caja: {reg.id}</span>
                      </div>
                    </div>
                  </div>
                </td>

                {/* Linked Branch name */}
                <td className="px-6 py-5">
                  <div className="text-sm font-semibold text-[#3F3F3F]">
                    {reg.branch?.name || `Sucursal #${reg.branchId}`}
                  </div>
                  <div className="text-xs text-[#6B6B6B] mt-0.5">ID Sede: {reg.branchId}</div>
                </td>

                {/* Registration Date */}
                <td className="px-6 py-5">
                  <div className="inline-flex items-center gap-1.5 text-xs text-[#6B6B6B] bg-[#F7F7F5] px-2.5 py-1 rounded-xl border border-[#D9D9D2]/30">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(reg.createdAt).toLocaleDateString('es-ES')}</span>
                  </div>
                </td>

                {/* Actions */}
                <td className="px-6 py-5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(reg)}
                      className="p-2 hover:bg-[#F7F7F5] text-[#6B6B6B] hover:text-[#3F3F3F] rounded-xl border border-transparent hover:border-[#D9D9D2]/30 transition-all duration-200"
                      title="Editar caja"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(reg.id)}
                      className="p-2 hover:bg-rose-50 text-[#6B6B6B] hover:text-rose-600 rounded-xl border border-transparent hover:border-[#D9D9D2]/30 transition-all duration-200"
                      title="Desactivar/Eliminar caja"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile view */}
      <div className="block md:hidden divide-y divide-[#D9D9D2]/30">
        {registers.map((reg) => (
          <div key={reg.id} className="p-5 hover:bg-[#F7F7F5]/20 transition-all duration-200">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#F7F7F5] text-[#3F3F3F] rounded-lg border border-[#D9D9D2]/30">
                  <Landmark className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="font-bold text-[#3F3F3F]">{reg.name}</h4>
                  <p className="text-[10px] text-[#6B6B6B]">ID Caja: {reg.id}</p>
                </div>
              </div>

              <div className="flex gap-1">
                <button
                  onClick={() => onEdit(reg)}
                  className="p-1.5 bg-[#F7F7F5] hover:bg-[#D9D9D2]/30 text-[#6B6B6B] hover:text-[#3F3F3F] rounded-lg border border-[#D9D9D2]/30 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(reg.id)}
                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[#D9D9D2]/10 pt-3">
              <div className="text-xs font-semibold text-[#3F3F3F]">
                {reg.branch?.name || `Sucursal #${reg.branchId}`}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-[#6B6B6B]">
                <Calendar className="w-3 h-3" />
                <span>{new Date(reg.createdAt).toLocaleDateString('es-ES')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
