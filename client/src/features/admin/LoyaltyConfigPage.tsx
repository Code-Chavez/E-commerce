import React, { useEffect, useState } from 'react';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { loyaltyAdminService } from './services/loyalty.service';
import type { LoyaltyConfig } from './services/loyalty.service';
import { toast } from 'react-hot-toast';
import { Loader2, Save, Gift } from 'lucide-react';

const LoyaltyConfigPage = () => {
  useDocumentTitle('Configuración de Lealtad | Admin');
  const [config, setConfig] = useState<LoyaltyConfig | null>(null);
  const [solesPerPoint, setSolesPerPoint] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await loyaltyAdminService.getLoyaltyConfig();
        if (data) {
          setConfig(data);
          setSolesPerPoint(data.solesPerPoint.toString());
        }
      } catch (error) {
        toast.error('Error al cargar la configuración de lealtad');
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedValue = Number(solesPerPoint);
    
    if (isNaN(parsedValue) || parsedValue <= 0) {
      toast.error('El valor debe ser un número mayor a 0');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await loyaltyAdminService.updateLoyaltyConfig({ solesPerPoint: parsedValue });
      setConfig(updated);
      setSolesPerPoint(updated.solesPerPoint.toString());
      toast.success('Regla de acumulación actualizada exitosamente');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Info */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-accent/10 text-brand-accent flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-brand-accent tracking-tight">Programa de Lealtad</h2>
            <p className="text-xs text-brand-text mt-0.5">Administra la regla general de acumulación de puntos por compras.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="max-w-md space-y-6">
            <div>
              <label htmlFor="solesPerPoint" className="block text-sm font-semibold text-gray-800 mb-2">
                Soles por cada Punto (S/ x Pts)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">S/</span>
                </div>
                <input
                  type="number"
                  id="solesPerPoint"
                  name="solesPerPoint"
                  min="0.1"
                  step="0.1"
                  className="block w-full pl-8 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-brand-accent focus:border-brand-accent text-gray-900 text-sm font-medium shadow-sm transition-colors"
                  placeholder="Ej: 5"
                  value={solesPerPoint}
                  onChange={(e) => setSolesPerPoint(e.target.value)}
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">= 1 Punto</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-brand-text/75">
                Determina cuántos soles debe gastar un cliente para obtener 1 punto de recompensa. 
                Ejemplo: Si configuras "5", un pedido de S/ 100 otorgará 20 puntos.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSaving || !solesPerPoint}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-brand-accent hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {isSaving ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </form>
        </div>
        
        {config?.updatedAt && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 text-xs text-gray-500 flex justify-between items-center">
            <span>Última actualización: {new Date(config.updatedAt).toLocaleString('es-PE')}</span>
            <span className={`px-2 py-1 rounded-full font-semibold ${config.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {config.isActive ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoyaltyConfigPage;
