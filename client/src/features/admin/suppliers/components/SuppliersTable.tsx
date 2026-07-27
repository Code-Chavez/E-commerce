import React from 'react';
import { Edit2, ToggleLeft, ToggleRight, User, MapPin, Hash, ShieldCheck, ShieldAlert, Briefcase } from 'lucide-react';
import type { Supplier } from '../hooks/useSuppliers';

interface SuppliersTableProps {
  suppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onToggleStatus: (id: number, currentStatus: boolean) => void;
}

export const SuppliersTable: React.FC<SuppliersTableProps> = ({
  suppliers,
  onEdit,
  onToggleStatus,
}) => {
  if (suppliers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-[#D9D9D2]/30 shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D9D9D2]/20 text-[#6B6B6B] mb-4">
          <User className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-[#3F3F3F]">No hay proveedores</h3>
        <p className="text-sm text-[#6B6B6B] mt-1 max-w-sm">
          No se encontraron proveedores registrados en el sistema. Registra uno nuevo para iniciar la gestión.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#D9D9D2]/30 bg-white shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#FAFAFA] border-b border-[#D9D9D2]/40">
            <th className="py-4 px-6 text-xs font-bold text-[#3F3F3F] uppercase tracking-wider">
              Proveedor / Razón Social
            </th>
            <th className="py-4 px-6 text-xs font-bold text-[#3F3F3F] uppercase tracking-wider">
              RUC
            </th>
            <th className="py-4 px-6 text-xs font-bold text-[#3F3F3F] uppercase tracking-wider">
              Rubro
            </th>
            <th className="py-4 px-6 text-xs font-bold text-[#3F3F3F] uppercase tracking-wider">
              Contacto
            </th>
            <th className="py-4 px-6 text-xs font-bold text-[#3F3F3F] uppercase tracking-wider">
              Dirección
            </th>
            <th className="py-4 px-6 text-xs font-bold text-[#3F3F3F] uppercase tracking-wider">
              Estado
            </th>
            <th className="py-4 px-6 text-xs font-bold text-[#3F3F3F] uppercase tracking-wider text-center">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#D9D9D2]/20">
          {suppliers.map((supplier) => (
            <tr 
              key={supplier.id}
              className="hover:bg-[#FAFAFA]/50 transition-colors group"
            >
              {/* Razon Social */}
              <td className="py-4 px-6">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all ${
                    supplier.isActive 
                      ? 'bg-[#3F3F3F]/5 text-[#3F3F3F] group-hover:bg-[#3F3F3F] group-hover:text-white' 
                      : 'bg-[#D9D9D2]/20 text-[#6B6B6B]'
                  }`}>
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <span className={`block font-bold text-sm leading-tight transition-all ${
                      supplier.isActive ? 'text-[#3F3F3F]' : 'text-[#6B6B6B] line-through'
                    }`}>
                      {supplier.razonSocial}
                    </span>
                    <span className="text-[11px] text-[#6B6B6B] mt-0.5 block">
                      ID: #{supplier.id}
                    </span>
                  </div>
                </div>
              </td>

              {/* RUC */}
              <td className="py-4 px-6 text-sm text-[#3F3F3F]">
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <Hash className="w-3.5 h-3.5 text-[#6B6B6B]" />
                  <span>{supplier.ruc}</span>
                </div>
              </td>

              {/* Rubro */}
              <td className="py-4 px-6 text-sm text-[#3F3F3F]">
                <div className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-[#6B6B6B]" />
                  <span className="font-medium">{supplier.rubro}</span>
                </div>
              </td>

              {/* Contacto */}
              <td className="py-4 px-6 text-sm text-[#3F3F3F]">
                <span className="font-medium">{supplier.contacto}</span>
              </td>

              {/* Direccion */}
              <td className="py-4 px-6 text-sm text-[#6B6B6B]">
                {supplier.direccion ? (
                  <div className="flex items-center gap-1.5 max-w-xs truncate">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-[#6B6B6B]/60" />
                    <span>{supplier.direccion}</span>
                  </div>
                ) : (
                  <span className="text-[#6B6B6B]/40 italic">No especificada</span>
                )}
              </td>

              {/* Estado */}
              <td className="py-4 px-6">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  supplier.isActive 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' 
                    : 'bg-red-50 text-red-700 border border-red-200/50'
                }`}>
                  {supplier.isActive ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Activo</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Inactivo</span>
                    </>
                  )}
                </span>
              </td>

              {/* Acciones */}
              <td className="py-4 px-6">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => onEdit(supplier)}
                    className="p-2 rounded-xl text-[#6B6B6B] hover:text-[#3F3F3F] hover:bg-[#D9D9D2]/20 transition-all"
                    title="Editar Proveedor"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onToggleStatus(supplier.id, supplier.isActive)}
                    className={`p-2 rounded-xl transition-all ${
                      supplier.isActive 
                        ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50' 
                        : 'text-[#6B6B6B] hover:text-[#3F3F3F] hover:bg-[#D9D9D2]/20'
                    }`}
                    title={supplier.isActive ? "Desactivar Proveedor" : "Activar Proveedor"}
                  >
                    {supplier.isActive ? (
                      <ToggleRight className="w-6 h-6" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
