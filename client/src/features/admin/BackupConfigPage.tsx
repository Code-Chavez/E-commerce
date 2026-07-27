import React, { useEffect, useState } from 'react';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { backupConfigService } from './services/backupConfig.service';
import type { BackupConfig } from './services/backupConfig.service';
import { toast } from 'react-hot-toast';
import { Loader2, Save, Database } from 'lucide-react';

const CRON_PRESETS = [
  { label: 'Diario a medianoche', value: '0 0 * * *' },
  { label: 'Diario a las 2 AM', value: '0 2 * * *' },
  { label: 'Semanal (domingos a medianoche)', value: '0 0 * * 0' },
  { label: 'Mensual (día 1 a medianoche)', value: '0 0 1 * *' },
  { label: 'Personalizado', value: '__custom__' },
];

function resolvePresetValue(cronExpression: string): string {
  const match = CRON_PRESETS.find((p) => p.value === cronExpression);
  return match ? cronExpression : '__custom__';
}

const BackupConfigPage = () => {
  useDocumentTitle('Configuración de Backups | Admin');

  const [config, setConfig] = useState<BackupConfig | null>(null);
  const [retentionDays, setRetentionDays] = useState<string>('');
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [cronPreset, setCronPreset] = useState<string>('0 0 * * *');
  const [customCron, setCustomCron] = useState<string>('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await backupConfigService.getConfig();
        setConfig(data);
        setRetentionDays(String(data.retentionDays));
        setAdminEmail(data.adminEmail);
        const preset = resolvePresetValue(data.cronExpression);
        setCronPreset(preset);
        if (preset === '__custom__') {
          setCustomCron(data.cronExpression);
        }
      } catch {
        toast.error('Error al cargar la configuración de backups');
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const effectiveCron = cronPreset === '__custom__' ? customCron : cronPreset;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedDays = Number(retentionDays);
    if (isNaN(parsedDays) || parsedDays < 1) {
      toast.error('La retención debe ser un número mayor a 0');
      return;
    }
    if (!adminEmail.trim()) {
      toast.error('El email de alerta es requerido');
      return;
    }
    if (!effectiveCron.trim()) {
      toast.error('La expresión cron es requerida');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await backupConfigService.updateConfig({
        retentionDays: parsedDays,
        adminEmail: adminEmail.trim(),
        cronExpression: effectiveCron.trim(),
      });
      setConfig(updated);
      setRetentionDays(String(updated.retentionDays));
      setAdminEmail(updated.adminEmail);
      const preset = resolvePresetValue(updated.cronExpression);
      setCronPreset(preset);
      if (preset === '__custom__') setCustomCron(updated.cronExpression);
      toast.success('Configuración de backup guardada');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#3F3F3F]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-accent/10 text-brand-accent flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-brand-accent tracking-tight">Configuración de Backups</h2>
            <p className="text-xs text-brand-text mt-0.5">
              Gestiona la política de respaldo automático de la base de datos.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="max-w-md space-y-6">

            {/* Retención */}
            <div>
              <label htmlFor="retentionDays" className="block text-sm font-semibold text-gray-800 mb-2">
                Retención de respaldos (días)
              </label>
              <input
                type="number"
                id="retentionDays"
                name="retentionDays"
                min="1"
                step="1"
                className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-brand-accent focus:border-brand-accent text-gray-900 text-sm font-medium shadow-sm transition-colors"
                placeholder="Ej: 7"
                value={retentionDays}
                onChange={(e) => setRetentionDays(e.target.value)}
                required
              />
              <p className="mt-2 text-xs text-brand-text/75">
                Los archivos de respaldo más antiguos que este valor serán eliminados automáticamente.
              </p>
            </div>

            {/* Email de alerta */}
            <div>
              <label htmlFor="adminEmail" className="block text-sm font-semibold text-gray-800 mb-2">
                Email de alerta de fallos
              </label>
              <input
                type="email"
                id="adminEmail"
                name="adminEmail"
                className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-brand-accent focus:border-brand-accent text-gray-900 text-sm font-medium shadow-sm transition-colors"
                placeholder="admin@e-commerce.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
              />
              <p className="mt-2 text-xs text-brand-text/75">
                Se enviará un correo a esta dirección si el respaldo automático falla.
              </p>
            </div>

            {/* Frecuencia */}
            <div>
              <label htmlFor="cronPreset" className="block text-sm font-semibold text-gray-800 mb-2">
                Frecuencia de ejecución
              </label>
              <select
                id="cronPreset"
                name="cronPreset"
                className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-brand-accent focus:border-brand-accent text-gray-900 text-sm font-medium shadow-sm transition-colors bg-white"
                value={cronPreset}
                onChange={(e) => setCronPreset(e.target.value)}
              >
                {CRON_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>

              {cronPreset === '__custom__' && (
                <div className="mt-3">
                  <label htmlFor="customCron" className="block text-xs font-semibold text-gray-600 mb-1">
                    Expresión cron personalizada
                  </label>
                  <input
                    type="text"
                    id="customCron"
                    name="customCron"
                    className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-brand-accent focus:border-brand-accent text-gray-900 text-sm font-mono shadow-sm transition-colors"
                    placeholder="0 3 * * *"
                    value={customCron}
                    onChange={(e) => setCustomCron(e.target.value)}
                    required
                  />
                </div>
              )}

              <p className="mt-2 text-xs text-brand-text/75">
                Nota: para aplicar un cambio de frecuencia es necesario reconstruir el contenedor de backup
                (<code className="bg-gray-100 px-1 rounded">docker compose up -d --build db-backup</code>).
              </p>
            </div>

            <button
              type="submit"
              disabled={isSaving || !retentionDays || !adminEmail}
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
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 text-xs text-gray-500">
            Última actualización: {new Date(config.updatedAt).toLocaleString('es-PE')}
          </div>
        )}
      </div>
    </div>
  );
};

export default BackupConfigPage;
