import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';

export interface ExportReportParams {
  type: 'sales' | 'inventory' | 'clients';
  format: 'pdf' | 'excel' | 'csv';
  from?: string;
  to?: string;
}

export const reportService = {
  exportReport: async (params: ExportReportParams): Promise<void> => {
    try {
      const query = new URLSearchParams();
      query.append('type', params.type);
      query.append('format', params.format);
      if (params.from) query.append('from', params.from);
      if (params.to) query.append('to', params.to);

      const response = await axiosInstance.get(`/v1/reports/export?${query.toString()}`, {
        responseType: 'blob',
      });

      // Attempt to extract filename from content-disposition header
      const contentDisposition = response.headers['content-disposition'] as string | undefined;
      let filename = `reporte-${params.type}-${new Date().toISOString().slice(0, 10)}`;
      
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+?)"/);
        if (match && match[1]) {
          filename = match[1];
        } else {
          const fallbackMatch = contentDisposition.match(/filename=(.+?)(;|$)/);
          if (fallbackMatch && fallbackMatch[1]) {
            filename = fallbackMatch[1].trim();
          }
        }
      } else {
        const extension = params.format === 'excel' ? 'xlsx' : params.format;
        filename = `${filename}.${extension}`;
      }

      // Create a blob from the response data
      const blob = new Blob([response.data], { type: (response.headers['content-type'] as string) || undefined });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Reporte descargado exitosamente');
    } catch (error: any) {
      console.error('Error exporting report:', error);
      toast.error('Error al exportar el reporte');
      throw error;
    }
  },
};
