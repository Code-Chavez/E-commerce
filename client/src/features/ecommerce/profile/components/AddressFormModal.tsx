import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { X, Loader2 } from 'lucide-react';
import { addressSchema, type AddressFormData } from '../schemas/address.schema';
import type { Address } from '../types/address.types';
import ubigeoData from '@/shared/data/ubigeo.json';

interface AddressFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddressFormData) => Promise<void>;
  address?: Address | null; // If editing
  isSaving: boolean;
}

export const AddressFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  address = null,
  isSaving,
}: AddressFormModalProps) => {
  const [selectedDeptName, setSelectedDeptName] = useState('');
  const [selectedProvName, setSelectedProvName] = useState('');
  const [selectedDistName, setSelectedDistName] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: yupResolver(addressSchema),
    defaultValues: {
      alias: '',
      fullAddress: '',
      district: '',
      reference: '',
      isDefault: false,
    },
  });

  const allDepartments = (ubigeoData as any).departments || [];
  const allProvinces = (ubigeoData as any).provinces || [];
  const allDistricts = (ubigeoData as any).districts || [];

  const departments = allDepartments;
  const provinces = allProvinces.filter((p: any) => p.department_id === departments.find((d: any) => d.name === selectedDeptName)?.id);
  const districtsData = allDistricts.filter((d: any) => d.province_id === provinces.find((p: any) => p.name === selectedProvName)?.id);

  // Prepopulate form when address prop changes (e.g. edit mode opens)
  useEffect(() => {
    if (address) {
      reset({
        alias: address.alias,
        fullAddress: address.fullAddress,
        district: address.district,
        reference: address.reference || '',
        isDefault: address.isDefault,
      });

      // Parse geographical hierarchy if formatted as 'Dept | Prov | Dist'
      if (address.district && address.district.includes('|')) {
        const parts = address.district.split('|').map(p => p.trim());
        if (parts.length === 3) {
          setSelectedDeptName(parts[0]);
          setSelectedProvName(parts[1]);
          setSelectedDistName(parts[2]);
        } else {
          setSelectedDeptName('');
          setSelectedProvName('');
          setSelectedDistName('');
        }
      } else {
        setSelectedDeptName('');
        setSelectedProvName('');
        setSelectedDistName(address.district || '');
      }
    } else {
      reset({
        alias: '',
        fullAddress: '',
        district: '',
        reference: '',
        isDefault: false,
      });
      setSelectedDeptName('');
      setSelectedProvName('');
      setSelectedDistName('');
    }
  }, [address, reset, isOpen]);

  // Synchronize form value with selected dropdowns
  useEffect(() => {
    if (selectedDeptName && selectedProvName && selectedDistName) {
      setValue('district', `${selectedDeptName} | ${selectedProvName} | ${selectedDistName}`);
    } else {
      setValue('district', '');
    }
  }, [selectedDeptName, selectedProvName, selectedDistName, setValue]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-brand-primary/40 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-primary/20 bg-brand-bg/50">
          <h2 className="text-lg font-extrabold text-brand-accent">
            {address ? 'Editar Dirección' : 'Nueva Dirección de Envío'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-brand-text hover:bg-brand-primary/20 hover:text-brand-accent transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Alias */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="alias" className="text-xs font-bold uppercase tracking-wider text-brand-accent">
              Alias de Dirección
            </label>
            <input
              id="alias"
              type="text"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-accent/20 bg-brand-bg/10 text-brand-accent ${
                errors.alias ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500' : 'border-brand-primary/60 focus:border-brand-accent'
              }`}
              placeholder="Ej. Casa, Trabajo, Dpto Novia"
              {...register('alias')}
            />
            {errors.alias && (
              <span className="text-xs text-red-500 font-medium">{errors.alias.message}</span>
            )}
          </div>

          {/* Full Address */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fullAddress" className="text-xs font-bold uppercase tracking-wider text-brand-accent">
              Dirección Completa
            </label>
            <input
              id="fullAddress"
              type="text"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-accent/20 bg-brand-bg/10 text-brand-accent ${
                errors.fullAddress ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500' : 'border-brand-primary/60 focus:border-brand-accent'
              }`}
              placeholder="Av. Javier Prado 123, Dpto 402"
              {...register('fullAddress')}
            />
            {errors.fullAddress && (
              <span className="text-xs text-red-500 font-medium">{errors.fullAddress.message}</span>
            )}
          </div>

          {/* Geographical selectors (Ubigeo) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Department */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="dept" className="text-xs font-bold uppercase tracking-wider text-brand-accent">
                Departamento
              </label>
              <select
                id="dept"
                value={selectedDeptName}
                onChange={(e) => {
                  setSelectedDeptName(e.target.value);
                  setSelectedProvName('');
                  setSelectedDistName('');
                }}
                className="w-full px-3 py-2.5 border border-brand-primary/60 rounded-xl focus:border-brand-accent outline-none bg-white text-sm font-semibold text-brand-accent focus:ring-2 focus:ring-brand-accent/20"
              >
                <option value="">Selecciona...</option>
                {departments.map((d: any) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Province */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="prov" className="text-xs font-bold uppercase tracking-wider text-brand-accent">
                Provincia
              </label>
              <select
                id="prov"
                value={selectedProvName}
                onChange={(e) => {
                  setSelectedProvName(e.target.value);
                  setSelectedDistName('');
                }}
                disabled={!selectedDeptName}
                className="w-full px-3 py-2.5 border border-brand-primary/60 rounded-xl focus:border-brand-accent outline-none bg-white text-sm font-semibold text-brand-accent focus:ring-2 focus:ring-brand-accent/20 disabled:opacity-50"
              >
                <option value="">Selecciona...</option>
                {provinces.map((p: any) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* District */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="dist" className="text-xs font-bold uppercase tracking-wider text-brand-accent">
                Distrito
              </label>
              <select
                id="dist"
                value={selectedDistName}
                onChange={(e) => setSelectedDistName(e.target.value)}
                disabled={!selectedProvName}
                className="w-full px-3 py-2.5 border border-brand-primary/60 rounded-xl focus:border-brand-accent outline-none bg-white text-sm font-semibold text-brand-accent focus:ring-2 focus:ring-brand-accent/20 disabled:opacity-50"
              >
                <option value="">Selecciona...</option>
                {districtsData.map((d: any) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {errors.district && (
            <span className="text-xs text-red-500 font-medium block mt-1">{errors.district.message}</span>
          )}

          {/* Reference */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="reference" className="text-xs font-bold uppercase tracking-wider text-brand-accent">
              Referencia (Opcional)
            </label>
            <textarea
              id="reference"
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-accent/20 bg-brand-bg/10 text-brand-accent border-brand-primary/60 focus:border-brand-accent resize-none"
              placeholder="Ej. Frente al Parque Kennedy, portón negro"
              {...register('reference')}
            />
          </div>

          {/* Is Default Checkbox */}
          {/* Only show/allow changing isDefault if it is not currently the default address, because backend requires another to be marked first */}
          {(!address || !address.isDefault) && (
            <div className="flex items-center gap-3 pt-2">
              <input
                id="isDefault"
                type="checkbox"
                className="w-4.5 h-4.5 text-brand-accent border-brand-primary/60 rounded focus:ring-brand-accent transition-all duration-200 cursor-pointer"
                {...register('isDefault')}
              />
              <label htmlFor="isDefault" className="text-xs font-bold text-brand-accent uppercase tracking-wider cursor-pointer select-none">
                Establecer como dirección predeterminada
              </label>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-primary/20">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-5 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 border border-brand-primary text-brand-text hover:bg-brand-primary/20 hover:text-brand-accent disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 text-xs font-bold rounded-xl focus:outline-none focus:ring-2 text-white bg-brand-accent hover:bg-brand-accent/90 focus:ring-brand-accent focus:ring-offset-2 transition-all duration-300 flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Guardar Dirección</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
