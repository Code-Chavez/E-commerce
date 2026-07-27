import { useState, useEffect, useCallback } from 'react';
import { adminNewsletterService } from '../services/adminNewsletterService';
import type { NewsletterSubscriber } from '../types/newsletter.types';
import { toast } from 'react-hot-toast';

export const useNewsletterSubscribers = () => {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminNewsletterService.getSubscribers({ page, limit });
      if (response.success) {
        setSubscribers(response.data);
        setTotal(response.total);
        setTotalPages(Math.ceil(response.total / limit) || 1);
        setError(null);
      } else {
        throw new Error('No se pudieron obtener los suscriptores');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al cargar los suscriptores del newsletter');
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  const exportData = useCallback(async (format: 'csv' | 'excel') => {
    setIsExporting(true);
    try {
      toast.loading('Generando descarga...', { id: 'newsletter-export' });
      await adminNewsletterService.exportSubscribers(format);
      toast.success('Descarga iniciada con éxito', { id: 'newsletter-export' });
    } catch (err: any) {
      console.error(err);
      toast.error('Error al descargar el archivo de suscriptores', { id: 'newsletter-export' });
    } finally {
      setIsExporting(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  return {
    subscribers,
    loading,
    error,
    page,
    setPage,
    total,
    totalPages,
    isExporting,
    refresh: fetchSubscribers,
    exportData,
  };
};
