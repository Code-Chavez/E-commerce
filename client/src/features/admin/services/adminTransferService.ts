import axiosInstance from '@/shared/api/axiosInstance';

export const adminTransferService = {
  /**
   * Solicita y descarga la Guía de Transferencia Interna en formato PDF para una transferencia específica.
   */
  async downloadTransferGuide(id: number): Promise<void> {
    const response = await axiosInstance.get(`/v1/stock-transfers/${id}/guide`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], {
      type: 'application/pdf',
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // Obtener nombre de archivo del header Content-Disposition si existe
    let filename = `guia-transferencia-${id}.pdf`;
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
