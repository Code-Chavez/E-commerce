import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';
import { handleIntegerKeyDown } from '@/shared/validation/documentValidators';
import { X, Loader2, UserPlus, Info, Search, CheckCircle } from 'lucide-react';
import { quickRegisterSchema } from '../schemas/quickRegister.schema';
import type { QuickRegisterFormData } from '../schemas/quickRegister.schema';
import type { ClientLookupResult } from '../types/pos.types';

interface QuickRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (client: { id: number; name: string; documentId: string }) => void;
}

export const QuickRegisterModal: React.FC<QuickRegisterModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [searchingPadrons, setSearchingPadrons] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [padronsData, setPadronsData] = useState<ClientLookupResult | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<QuickRegisterFormData>({
    resolver: yupResolver(quickRegisterSchema),
    defaultValues: {
      documentType: 'DNI',
      documentId: '',
      phone: '',
      email: '',
    },
  });

  const watchedDocumentType = watch('documentType');
  const watchedDocumentId = watch('documentId');

  // Reset form when modal is closed
  useEffect(() => {
    if (!isOpen) {
      reset({
        documentType: 'DNI',
        documentId: '',
        phone: '',
        email: '',
      });
      setPadronsData(null);
    }
  }, [isOpen, reset]);

  // Live Padron Lookup via Factiliza when full length is typed
  useEffect(() => {
    if (!watchedDocumentId) {
      setPadronsData(null);
      return;
    }

    const isDniFull = watchedDocumentType === 'DNI' && watchedDocumentId.length === 8;
    const isRucFull = watchedDocumentType === 'RUC' && watchedDocumentId.length === 11;

    if (!isDniFull && !isRucFull) {
      setPadronsData(null);
      return;
    }

    const performLookup = async () => {
      setSearchingPadrons(true);
      try {
        const { data } = await axiosInstance.get(
          `/v1/pos/clients/lookup?type=${watchedDocumentType}&number=${watchedDocumentId}`
        );
        if (data.success && data.data) {
          setPadronsData(data.data);
          toast.success('Datos recuperados del padrón');
        } else {
          setPadronsData(null);
        }
      } catch (err: any) {
        setPadronsData(null);
        const errMsg = err.response?.data?.error || 'Documento no encontrado';
        toast.error(errMsg);
      } finally {
        setSearchingPadrons(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      performLookup();
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [watchedDocumentId, watchedDocumentType]);

  const onSubmitForm = async (data: QuickRegisterFormData) => {
    setSubmitting(true);
    try {
      const { data: res } = await axiosInstance.post('/v1/pos/clients/quick-register', data);
      if (res.success && res.data) {
        toast.success(`Cliente "${res.data.name}" registrado con éxito`);
        if (onSuccess) {
          onSuccess({
            id: res.data.id,
            name: `${res.data.name} ${res.data.lastName || ''}`.trim(),
            documentId: res.data.documentId,
          });
        }
        onClose();
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Error al registrar cliente';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col border border-[#D9D9D2]/30 animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D9D9D2]/40 bg-[#F7F7F5]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#D9D9D2]/40 text-[#3F3F3F] rounded-lg">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#3F3F3F]">
                Registro Rápido de Cliente
              </h2>
              <p className="text-xs text-[#6B6B6B]">
                Alta rápida con validación del padrón SUNAT.
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

        {/* Content Form */}
        <form onSubmit={handleSubmit(onSubmitForm)} className="p-6 space-y-4">

          {/* Doc Type Selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#3F3F3F] flex items-center gap-1.5">
              Tipo de Documento <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['DNI', 'RUC'].map((type) => (
                <label
                  key={type}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-sm font-bold cursor-pointer transition-all duration-200 ${watchedDocumentType === type
                    ? 'bg-[#3F3F3F] text-white border-[#3F3F3F]'
                    : 'bg-[#F7F7F5] text-[#3F3F3F] border-[#D9D9D2] hover:bg-[#FAFAFA]'
                    }`}
                >
                  <input
                    type="radio"
                    value={type}
                    {...register('documentType')}
                    className="sr-only"
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Doc ID Number Input with dynamic loader */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#3F3F3F] flex items-center gap-1.5">
              Número de Documento <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                maxLength={watchedDocumentType === 'DNI' ? 8 : 11}
                {...register('documentId')}
                onKeyDown={handleIntegerKeyDown}
                placeholder={watchedDocumentType === 'DNI' ? 'Ingresa 8 dígitos' : 'Ingresa 11 dígitos'}
                className={`w-full px-4 py-2.5 bg-[#F7F7F5] border rounded-xl outline-none transition-all duration-200 text-[#3F3F3F] font-bold tracking-wider placeholder-[#6B6B6B]/40 focus:ring-1 focus:ring-[#3F3F3F] ${errors.documentId ? 'border-rose-400 focus:border-rose-400' : 'border-[#D9D9D2] focus:border-[#3F3F3F]'
                  }`}
              />
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                {searchingPadrons ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#3F3F3F]" />
                ) : padronsData ? (
                  <CheckCircle className="w-4.5 h-4.5 text-emerald-600" />
                ) : (
                  <Search className="w-4 h-4 text-[#6B6B6B]/50" />
                )}
              </div>
            </div>
            {errors.documentId && (
              <p className="text-xs text-rose-500 font-medium mt-1">{errors.documentId.message}</p>
            )}
          </div>

          {/* Padron Information Box */}
          {padronsData && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200/50 rounded-xl space-y-1.5 animate-in fade-in duration-200">
              <div className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                Datos Recuperados
              </div>
              <div className="font-bold text-sm text-emerald-950">
                {padronsData.name} {padronsData.lastName || ''}
              </div>
              {padronsData.address && (
                <div className="text-xs text-emerald-800 leading-tight">
                  <span className="font-semibold">Dir:</span> {padronsData.address}
                </div>
              )}
            </div>
          )}

          {/* Phone Input */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#3F3F3F] flex items-center gap-1.5">
              Número de Teléfono <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={9}
              {...register('phone')}
              onKeyDown={handleIntegerKeyDown}
              placeholder="Ej. 987654321"
              className={`w-full px-4 py-2.5 bg-[#F7F7F5] border rounded-xl outline-none transition-all duration-200 text-[#3F3F3F] ${errors.phone ? 'border-rose-400 focus:border-rose-400' : 'border-[#D9D9D2] focus:border-[#3F3F3F]'
                }`}
            />
            {errors.phone && (
              <p className="text-xs text-rose-500 font-medium mt-1">{errors.phone.message}</p>
            )}
          </div>

          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#3F3F3F] flex items-center gap-1.5">
              Correo Electrónico
            </label>
            <input
              type="email"
              {...register('email')}
              placeholder="cliente@correo.com (Opcional)"
              className={`w-full px-4 py-2.5 bg-[#F7F7F5] border rounded-xl outline-none transition-all duration-200 text-[#3F3F3F] ${errors.email ? 'border-rose-400 focus:border-rose-400' : 'border-[#D9D9D2] focus:border-[#3F3F3F]'
                }`}
            />
            {errors.email && (
              <p className="text-xs text-rose-500 font-medium mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Help Tip */}
          <div className="p-3 bg-[#F7F7F5] rounded-xl border border-[#D9D9D2]/30 flex items-start gap-2 text-xs text-[#6B6B6B] leading-tight">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              El cliente se insertará en la base de datos de manera inmediata y estará habilitado para búsquedas predictivas y facturación.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D9D9D2]/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#3F3F3F] font-semibold hover:bg-[#D9D9D2]/40 rounded-xl transition-colors duration-200 text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || searchingPadrons}
              className="bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm text-sm disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Registrar Cliente</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
