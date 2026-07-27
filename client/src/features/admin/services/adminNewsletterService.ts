import axiosInstance from '@/shared/api/axiosInstance';
import type { NewsletterSubscribersResponse } from '../types/newsletter.types';

export interface GetSubscribersParams {
  page: number;
  limit: number;
}

export const adminNewsletterService = {
  /**
   * Obtiene la lista paginada de suscriptores activos al newsletter.
   */
  async getSubscribers(params: GetSubscribersParams): Promise<NewsletterSubscribersResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('page', params.page.toString());
    queryParams.append('limit', params.limit.toString());

    const { data } = await axiosInstance.get<NewsletterSubscribersResponse>(
      `/v1/admin/newsletter/subscribers?${queryParams.toString()}`
    );
    return data;
  },

  /**
   * Solicita y descarga la lista de suscriptores en formato CSV o Excel.
   */
  async exportSubscribers(format: 'csv' | 'excel'): Promise<void> {
    const response = await axiosInstance.get(`/v1/admin/newsletter/subscribers/export?format=${format}`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], {
      type: format === 'csv' 
        ? 'text/csv;charset=utf-8' 
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // Obtener nombre de archivo del header Content-Disposition si existe
    let filename = `newsletter_subscribers_${Date.now()}.${format === 'csv' ? 'csv' : 'xlsx'}`;
    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
