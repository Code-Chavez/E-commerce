import { useState, useEffect, useCallback } from 'react';
import { alertsService } from '@/shared/api/alertsService';
import type { AutoReturnAlert } from '@/shared/api/alertsService';

export const useAutoReturnAlerts = () => {
  const [alerts, setAlerts] = useState<AutoReturnAlert[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await alertsService.getAutoReturnAlerts();
      if (response.success) setAlerts(response.data);
    } catch {
      // silently ignore — non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  const dismissAlert = async (id: number) => {
    try {
      await alertsService.dismissAutoReturnAlert(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch {
      // silently ignore
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  return { alerts, loading, fetchAlerts, dismissAlert };
};
