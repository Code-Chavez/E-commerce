import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';
import { Sliders, Save, X, Edit2, Loader2, Info } from 'lucide-react';

interface SystemSetting {
  key: string;
  value: string;
  description: string;
}

const SETTING_UNITS: Record<string, string> = {
  MIN_STOCK_ALERT: 'unidades',
  PENDING_ORDER_TOLERANCE_HOURS: 'horas',
  ABANDONED_CART_HOURS: 'horas',
  BIRTHDAY_COUPON_DAYS: 'días',
  FAILED_DELIVERY_DECISION_WINDOW_HOURS: 'horas',
};

export const SystemSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue } = useForm<{ value: string }>();

  const fetchSettings = async () => {
    try {
      const res = await axiosInstance.get('/v1/admin/settings');
      setSettings(res.data);
    } catch (error) {
      toast.error('Error al cargar parámetros del sistema');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleEdit = (setting: SystemSetting) => {
    setEditingKey(setting.key);
    setValue('value', setting.value);
  };

  const onSubmit = async (data: { value: string }) => {
    if (!editingKey) return;
    try {
      await axiosInstance.put(`/v1/admin/settings/${editingKey}`, { value: data.value });
      toast.success('Parámetro actualizado correctamente');
      setEditingKey(null);
      reset();
      fetchSettings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar el parámetro');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#3F3F3F]" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#3F3F3F] flex items-center gap-3">
            <Sliders className="w-8 h-8 text-[#3F3F3F]" />
            Parámetros del Sistema
          </h1>
          <p className="text-[#3F3F3F]/60 mt-2 text-sm font-medium">Configura las reglas globales y alertas automáticas de la plataforma.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#D9D9D2] overflow-hidden">
        <ul className="divide-y divide-[#D9D9D2]/40">
          {settings.map((setting) => (
            <li key={setting.key} className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-[#FAFAFA] transition-colors duration-200">
              <div className="flex-1 mb-4 md:mb-0 pr-4">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-[#3F3F3F] uppercase tracking-wide">{setting.key}</p>
                </div>
                <div className="flex items-start gap-1.5 mt-1">
                  <Info className="w-4 h-4 text-[#6B6B6B] shrink-0 mt-0.5" />
                  <p className="text-sm text-[#6B6B6B] font-medium">{setting.description}</p>
                </div>
                
                {editingKey !== setting.key && (
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-[#3F3F3F]">{setting.value}</span>
                    <span className="text-sm font-semibold text-[#6B6B6B]">{SETTING_UNITS[setting.key] || ''}</span>
                  </div>
                )}
              </div>
              
              <div className="flex-shrink-0 min-w-[280px]">
                {editingKey === setting.key ? (
                  <form onSubmit={handleSubmit(onSubmit)} className="flex items-center gap-2 bg-[#FAFAFA] p-2 rounded-xl border border-[#D9D9D2]/60">
                    <input
                      type="number"
                      min="1"
                      className="flex-1 bg-white border border-[#D9D9D2] text-[#3F3F3F] rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]/20 focus:border-[#3F3F3F] transition-all"
                      {...register('value', { required: true, min: 1 })}
                      autoFocus
                    />
                    <span className="text-sm font-medium text-[#6B6B6B] px-1">{SETTING_UNITS[setting.key] || ''}</span>
                    <button 
                      type="submit" 
                      className="p-2 bg-[#3F3F3F] text-[#F7F7F5] rounded-lg hover:bg-[#3F3F3F]/90 transition-all hover:scale-105 active:scale-95 shadow-sm"
                      title="Guardar"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setEditingKey(null)} 
                      className="p-2 bg-white text-[#6B6B6B] border border-[#D9D9D2] rounded-lg hover:bg-[#FAFAFA] transition-all hover:scale-105 active:scale-95 shadow-sm"
                      title="Cancelar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <div className="flex justify-end">
                    <button 
                      onClick={() => handleEdit(setting)} 
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-[#D9D9D2] text-[#3F3F3F] rounded-xl hover:bg-[#FAFAFA] hover:border-[#3F3F3F]/30 transition-all font-semibold text-sm shadow-sm hover:shadow active:scale-[0.98]"
                    >
                      <Edit2 className="w-4 h-4" />
                      Modificar
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
