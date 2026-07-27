import axiosInstance from '@/shared/api/axiosInstance';
import type { OrdersResponse } from '../types';

export const orderService = {
  /**
   * Obtiene la lista de pedidos del usuario autenticado de forma paginada y filtrada.
   */
  async fetchUserOrders(params: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<OrdersResponse> {
    const queryParams = new URLSearchParams();
    if (params.status && params.status !== 'ALL') {
      queryParams.append('status', params.status);
    }
    if (params.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }

    const { data } = await axiosInstance.get(`/v1/orders?${queryParams.toString()}`);
    if (!data.success) {
      throw new Error(data.error || 'No se pudieron cargar los pedidos');
    }
    return data.data;
  },

  /**
   * Descarga el comprobante de pago en formato PDF para el pedido especificado.
   */
  async downloadOrderReceiptPdf(orderId: number): Promise<void> {
    const response = await axiosInstance.get(`/v1/orders/${orderId}/receipt/pdf`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `comprobante-pedido-${orderId}.pdf`);
    document.body.appendChild(link);
    link.click();

    // Limpieza de memoria y DOM
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Solicita el reenvío de un pedido con entrega fallida.
   * Genera un nuevo envío enlazado al fallido y el pedido vuelve al flujo normal.
   */
  async requestRedelivery(orderId: number): Promise<void> {
    const { data } = await axiosInstance.post(`/v1/orders/${orderId}/redelivery`);
    if (!data.success) {
      throw new Error(data.error || 'No se pudo solicitar el reenvío');
    }
  },

  /**
   * Solicita la devolución de un pedido con entrega fallida.
   * El pedido pasa a RETURNED y el reembolso queda registrado como pendiente.
   */
  async requestReturnFromFailed(orderId: number): Promise<void> {
    const { data } = await axiosInstance.post(`/v1/orders/${orderId}/return-from-failed`);
    if (!data.success) {
      throw new Error(data.error || 'No se pudo solicitar la devolución');
    }
  },
};
