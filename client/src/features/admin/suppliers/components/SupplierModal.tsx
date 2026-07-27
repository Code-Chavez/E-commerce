import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { X, Loader2, ClipboardList, User, MapPin, Hash, Briefcase } from 'lucide-react';
import { supplierSchema } from '../schemas/supplier.schema';
import { handleIntegerKeyDown } from '@/shared/validation/documentValidators';
import type { SupplierFormData } from '../schemas/supplier.schema';
import type { Supplier } from '../hooks/useSuppliers';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SupplierFormData) => Promise<any>;
  editingSupplier: Supplier | null;
  submitting: boolean;
}

export const SupplierModal: React.FC<SupplierModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingSupplier,
  submitting,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SupplierFormData>({
    resolver: yupResolver(supplierSchema) as any,
    defaultValues: {
      ruc: '',
      razonSocial: '',
      rubro: '',
      contacto: '',
      direccion: '',
    },
  });

  useEffect(() => {
    if (editingSupplier) {
      reset({
        ruc: editingSupplier.ruc,
        razonSocial: editingSupplier.razonSocial,
        rubro: editingSupplier.rubro,
        contacto: editingSupplier.contacto,
        direccion: editingSupplier.direccion || '',
      });
    } else {
      reset({
        ruc: '',
        razonSocial: '',
        rubro: '',
        contacto: '',
        direccion: '',
      });
    }
  }, [editingSupplier, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#1e1e1a]/40 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-[#D9D9D2]/30 transition-all duration-300 transform scale-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#D9D9D2]/40 bg-[#FAFAFA] p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3F3F3F] text-white">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#3F3F3F]">
                {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </h3>
              <p className="text-xs text-[#6B6B6B]">
                {editingSupplier ? 'Actualiza los datos del proveedor seleccionado' : 'Registra un nuevo socio comercial en el sistema'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#6B6B6B] hover:bg-[#D9D9D2]/20 hover:text-[#3F3F3F] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* RUC Field */}
          <div>
            <label htmlFor="ruc" className="block text-xs font-bold text-[#3F3F3F] uppercase tracking-wider mb-2">
              RUC (11 dígitos) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B6B6B]">
                <Hash className="w-4 h-4" />
              </div>
              <input
                id="ruc"
                type="text"
                placeholder="Ej. 20123456789"
                disabled={submitting}
                inputMode="numeric"
                maxLength={11}
                onKeyDown={handleIntegerKeyDown}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-[#FAFAFA] text-sm text-[#3F3F3F] placeholder-[#6B6B6B]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]/20 focus:border-[#3F3F3F] transition-all ${
                  errors.ruc ? 'border-red-500 ring-1 ring-red-500/20' : 'border-[#D9D9D2]/70'
                }`}
                {...register('ruc')}
              />
            </div>
            {errors.ruc && (
              <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.ruc.message}</p>
            )}
          </div>

          {/* Razon Social Field */}
          <div>
            <label htmlFor="razonSocial" className="block text-xs font-bold text-[#3F3F3F] uppercase tracking-wider mb-2">
              Razón Social *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B6B6B]">
                <ClipboardList className="w-4 h-4" />
              </div>
              <input
                id="razonSocial"
                type="text"
                placeholder="Ej. Textiles Premium S.A.C."
                disabled={submitting}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-[#FAFAFA] text-sm text-[#3F3F3F] placeholder-[#6B6B6B]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]/20 focus:border-[#3F3F3F] transition-all ${
                  errors.razonSocial ? 'border-red-500 ring-1 ring-red-500/20' : 'border-[#D9D9D2]/70'
                }`}
                {...register('razonSocial')}
              />
            </div>
            {errors.razonSocial && (
              <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.razonSocial.message}</p>
            )}
          </div>

          {/* Rubro Field */}
          <div>
            <label htmlFor="rubro" className="block text-xs font-bold text-[#3F3F3F] uppercase tracking-wider mb-2">
              Rubro *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B6B6B]">
                <Briefcase className="w-4 h-4" />
              </div>
              <input
                id="rubro"
                type="text"
                placeholder="Ej. Distribución, Tecnología, Textil"
                disabled={submitting}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-[#FAFAFA] text-sm text-[#3F3F3F] placeholder-[#6B6B6B]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]/20 focus:border-[#3F3F3F] transition-all ${
                  errors.rubro ? 'border-red-500 ring-1 ring-red-500/20' : 'border-[#D9D9D2]/70'
                }`}
                {...register('rubro')}
              />
            </div>
            {errors.rubro && (
              <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.rubro.message}</p>
            )}
          </div>

          {/* Contacto Field */}
          <div>
            <label htmlFor="contacto" className="block text-xs font-bold text-[#3F3F3F] uppercase tracking-wider mb-2">
              Nombre de Contacto *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B6B6B]">
                <User className="w-4 h-4" />
              </div>
              <input
                id="contacto"
                type="text"
                placeholder="Ej. Carlos López"
                disabled={submitting}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-[#FAFAFA] text-sm text-[#3F3F3F] placeholder-[#6B6B6B]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]/20 focus:border-[#3F3F3F] transition-all ${
                  errors.contacto ? 'border-red-500 ring-1 ring-red-500/20' : 'border-[#D9D9D2]/70'
                }`}
                {...register('contacto')}
              />
            </div>
            {errors.contacto && (
              <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.contacto.message}</p>
            )}
          </div>

          {/* Direccion Field */}
          <div>
            <label htmlFor="direccion" className="block text-xs font-bold text-[#3F3F3F] uppercase tracking-wider mb-2">
              Dirección (Opcional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B6B6B]">
                <MapPin className="w-4 h-4" />
              </div>
              <input
                id="direccion"
                type="text"
                placeholder="Ej. Av. Industrial 123, Lima"
                disabled={submitting}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-[#FAFAFA] text-sm text-[#3F3F3F] placeholder-[#6B6B6B]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]/20 focus:border-[#3F3F3F] transition-all ${
                  errors.direccion ? 'border-red-500 ring-1 ring-red-500/20' : 'border-[#D9D9D2]/70'
                }`}
                {...register('direccion')}
              />
            </div>
            {errors.direccion && (
              <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.direccion.message}</p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-[#D9D9D2]/40 pt-5 mt-8">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#D9D9D2] text-[#3F3F3F] hover:bg-[#FAFAFA] transition-colors text-sm font-semibold disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3F3F3F] text-white hover:bg-[#1e1e1a] transition-all text-sm font-semibold shadow-lg shadow-black/10 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>{editingSupplier ? 'Guardar Cambios' : 'Registrar'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
