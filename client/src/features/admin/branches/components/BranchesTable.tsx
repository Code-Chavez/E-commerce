import React from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Edit3, 
  CheckCircle, 
  XCircle, 
  Warehouse as WarehouseIcon,
  Calendar,
  AlertCircle,
  Star
} from 'lucide-react';
import type { Branch } from '../hooks/useBranches';

interface BranchesTableProps {
  branches: Branch[];
  loading: boolean;
  onEdit: (branch: Branch) => void;
  onToggleStatus: (id: number, currentStatus: boolean) => void;
}

export const BranchesTable: React.FC<BranchesTableProps> = ({
  branches,
  loading,
  onEdit,
  onToggleStatus,
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-[#D9D9D2]/40 shadow-sm">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-[#D9D9D2] opacity-25"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-[#3F3F3F] animate-spin"></div>
        </div>
        <p className="mt-4 text-sm text-[#6B6B6B] font-medium tracking-wide">Cargando sucursales comerciales...</p>
      </div>
    );
  }

  if (branches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 bg-white rounded-2xl border border-[#D9D9D2]/40 shadow-sm text-center">
        <div className="p-4 bg-[#F7F7F5] rounded-full text-[#6B6B6B] mb-4">
          <Building2 className="w-10 h-10 stroke-[1.5]" />
        </div>
        <h3 className="text-lg font-semibold text-[#3F3F3F]">Sin sucursales registradas</h3>
        <p className="text-sm text-[#6B6B6B] max-w-sm mt-1">
          No hay sucursales disponibles en este momento. Crea una nueva para habilitar su almacén independiente.
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
              <th className="px-6 py-4">Información de Sucursal</th>
              <th className="px-6 py-4">Contacto y Ubicación</th>
              <th className="px-6 py-4">Almacén Independiente (1:1)</th>
              <th className="px-6 py-4">Estado Comercial</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D9D9D2]/20">
            {branches.map((branch) => (
              <tr 
                key={branch.id} 
                className="hover:bg-[#F7F7F5]/40 transition-colors duration-200 group"
              >
                {/* Branch name and core info */}
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#F7F7F5] text-[#3F3F3F] rounded-xl border border-[#D9D9D2]/30 group-hover:scale-105 transition-transform duration-200">
                      <Building2 className="w-5 h-5 stroke-[1.8]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[#3F3F3F] text-base">{branch.name}</span>
                        {branch.isMain && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span>Principal</span>
                          </span>
                        )}
                        {branch.igvExempt && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                            Exonerada IGV
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#6B6B6B] mt-0.5">ID Sucursal: {branch.id}</div>
                    </div>
                  </div>
                </td>

                {/* Location and Phone */}
                <td className="px-6 py-5">
                  <div className="space-y-1.5 text-sm text-[#6B6B6B]">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#6B6B6B]/60 flex-shrink-0" />
                      <span className="truncate max-w-[220px]" title={branch.address || 'Sin dirección asignada'}>
                        {branch.address || <span className="italic text-[#6B6B6B]/40">Sin dirección</span>}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#6B6B6B]/60 flex-shrink-0" />
                      <span>
                        {branch.phone || <span className="italic text-[#6B6B6B]/40">Sin teléfono</span>}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Autogenerated 1:1 Warehouse details */}
                <td className="px-6 py-5">
                  {branch.warehouse ? (
                    <div className="inline-flex flex-col gap-1 p-2 bg-[#F7F7F5] rounded-xl border border-[#D9D9D2]/30">
                      <div className="flex items-center gap-1.5 text-xs text-[#3F3F3F] font-semibold">
                        <WarehouseIcon className="w-3.5 h-3.5" />
                        <span>Almacén #{branch.warehouse.id}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-[#6B6B6B]">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(branch.warehouse.createdAt).toLocaleDateString('es-ES')}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 border border-amber-200/50 rounded-lg py-1 px-2.5 w-fit">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-medium">No vinculado</span>
                    </div>
                  )}
                </td>

                {/* Status Toggle */}
                <td className="px-6 py-5">
                  <button
                    onClick={() => onToggleStatus(branch.id, branch.isActive)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer border transition-all duration-200 hover:scale-[1.03] ${
                      branch.isActive
                        ? 'bg-[#F7F7F5] text-emerald-700 border-emerald-300/40 shadow-sm'
                        : 'bg-[#F7F7F5] text-rose-700 border-rose-300/40 shadow-sm'
                    }`}
                  >
                    {branch.isActive ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    )}
                    {branch.isActive ? 'Activa' : 'Inactiva'}
                  </button>
                </td>

                {/* Actions */}
                <td className="px-6 py-5 text-right">
                  <button
                    onClick={() => onEdit(branch)}
                    className="p-2 hover:bg-[#F7F7F5] text-[#6B6B6B] hover:text-[#3F3F3F] rounded-xl border border-transparent hover:border-[#D9D9D2]/30 transition-all duration-200"
                    title="Editar sucursal"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile view (cards list) */}
      <div className="block md:hidden divide-y divide-[#D9D9D2]/30">
        {branches.map((branch) => (
          <div key={branch.id} className="p-5 hover:bg-[#F7F7F5]/20 transition-all duration-200">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#F7F7F5] text-[#3F3F3F] rounded-lg border border-[#D9D9D2]/30">
                  <Building2 className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="font-bold text-[#3F3F3F]">{branch.name}</h4>
                    {branch.isMain && (
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 flex-shrink-0" />
                    )}
                    {branch.igvExempt && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Exonerada IGV
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#6B6B6B]">ID Sucursal: {branch.id}</p>
                </div>
              </div>

              <button
                onClick={() => onEdit(branch)}
                className="p-1.5 bg-[#F7F7F5] hover:bg-[#D9D9D2]/30 text-[#6B6B6B] hover:text-[#3F3F3F] rounded-lg border border-[#D9D9D2]/30 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs text-[#6B6B6B]">
                <MapPin className="w-3.5 h-3.5 text-[#6B6B6B]/60 flex-shrink-0" />
                <span>{branch.address || <span className="italic text-[#6B6B6B]/40">Sin dirección</span>}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#6B6B6B]">
                <Phone className="w-3.5 h-3.5 text-[#6B6B6B]/60 flex-shrink-0" />
                <span>{branch.phone || <span className="italic text-[#6B6B6B]/40">Sin teléfono</span>}</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[#D9D9D2]/10 pt-3">
              {/* Almacén */}
              {branch.warehouse ? (
                <div className="flex items-center gap-1.5 text-xs text-[#3F3F3F] bg-[#F7F7F5] py-1 px-2.5 rounded-lg border border-[#D9D9D2]/30">
                  <WarehouseIcon className="w-3.5 h-3.5 text-[#6B6B6B]" />
                  <span>Almacén #{branch.warehouse.id}</span>
                </div>
              ) : (
                <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded">No vinculado</span>
              )}

              {/* Estado */}
              <button
                onClick={() => onToggleStatus(branch.id, branch.isActive)}
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  branch.isActive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {branch.isActive ? 'Activa' : 'Inactiva'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
