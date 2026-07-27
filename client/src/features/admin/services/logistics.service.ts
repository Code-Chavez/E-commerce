import axiosInstance from '@/shared/api/axiosInstance';
import type { Delivery, FailedAttempt, PickingResponse, AssignDeliveryManResponse, OrderToPick, DeliveryMan, DeliveriesByZoneGroup } from '../types/logistics.types';

export const logisticsService = {
  /**
   * Obtiene la lista de pedidos pagados sin despacho asociado desde el backend
   */
  getPendingOrders: async (): Promise<OrderToPick[]> => {
    const { data } = await axiosInstance.get<{ success: boolean; data: OrderToPick[] }>('/v1/logistics/orders/pending');
    return data.data;
  },

  /**
   * Genera una lista de picking agrupando todas las órdenes que tienen estado PAID 
   * y que no cuentan con un despacho (Delivery) asociado. Permite enviar orderIds.
   */
  generatePickingList: async (orderIds?: number[]): Promise<Delivery[]> => {
    const { data } = await axiosInstance.post<PickingResponse>('/v1/logistics/picking', { orderIds });
    return data.data;
  },

  /**
   * Obtiene la lista de despachos generados (Deliveries), con opción de filtrar por status
   */
  getDeliveries: async (status?: string): Promise<Delivery[]> => {
    const { data } = await axiosInstance.get<{ success: boolean; data: Delivery[] }>('/v1/logistics/deliveries', {
      params: { status }
    });
    return data.data;
  },

  /**
   * Obtiene la lista de entregas pendientes agrupadas por zona
   */
  getPendingDeliveriesByZone: async (): Promise<DeliveriesByZoneGroup[]> => {
    const { data } = await axiosInstance.get<{ success: boolean; data: DeliveriesByZoneGroup[] }>('/v1/logistics/deliveries/by-zone');
    return data.data;
  },
  /**
   * Obtiene la lista de repartidores (usuarios con rol DELIVERY)
   */
  getDeliveryMen: async (): Promise<DeliveryMan[]> => {
    const { data } = await axiosInstance.get<{ success: boolean; data: DeliveryMan[] }>('/v1/logistics/delivery-men');
    return data.data;
  },

  /**
   * Asigna un repartidor a un despacho existente
   */
  assignDeliveryMan: async (deliveryId: number, deliveryManId: number): Promise<Delivery> => {
    const { data } = await axiosInstance.post<AssignDeliveryManResponse>(`/v1/logistics/deliveries/${deliveryId}/assign`, {
      deliveryManId
    });
    return data.data;
  },

  /**
   * Descarga la etiqueta de despacho en PDF
   */
  downloadShippingLabel: async (deliveryId: number): Promise<void> => {
    try {
      const response = await axiosInstance.get(`/v1/logistics/deliveries/${deliveryId}/label`, {
        responseType: 'blob'
      });

      // Validar si el backend devolvió un JSON con error en lugar del PDF
      if (response.data.type === 'application/json') {
        const text = await response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.error || 'Error al generar la etiqueta');
      }
      
      // Create a Blob from the PDF Stream
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      
      // Create an anchor link and trigger download
      const link = document.createElement('a');
      link.href = fileURL;
      link.download = `shipping-label-${deliveryId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      if (err.response && err.response.data instanceof Blob && err.response.data.type === 'application/json') {
        const text = await err.response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.error || 'Error al descargar la etiqueta');
      }
      throw err;
    }
  },

  /**
   * Actualiza el estado de un despacho existente
   */
  updateDeliveryStatus: async (deliveryId: number, status: string): Promise<Delivery> => {
    const { data } = await axiosInstance.patch<{ success: boolean; data: Delivery }>(`/v1/logistics/deliveries/${deliveryId}/status`, {
      status
    });
    return data.data;
  },

  /**
   * Confirma la entrega subiendo foto de evidencia — cambia status a DELIVERED
   */
  confirmDelivery: async (deliveryId: number, photoFile: File): Promise<Delivery> => {
    const formData = new FormData();
    formData.append('photo', photoFile);
    const { data } = await axiosInstance.patch<{ success: boolean; data: Delivery }>(
      `/v1/logistics/deliveries/${deliveryId}/confirm`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data.data;
  },

  /**
   * Confirma la entrega validando el PIN de 6 dígitos del cliente.
   * Actualiza Delivery y Order a DELIVERED de forma atómica.
   */
  confirmDeliveryPin: async (
    deliveryId: number,
    pin: string,
  ): Promise<{ deliveryId: number; orderId: number; status: string; deliveredAt: string }> => {
    const { data } = await axiosInstance.post<{
      success: boolean;
      data: { deliveryId: number; orderId: number; status: string; deliveredAt: string };
    }>(`/v1/logistics/deliveries/${deliveryId}/confirm-pin`, { pin });
    return data.data;
  },

  /**
   * Registra un intento de entrega fallido. El backend decide el estado resultante:
   * AWAITING_CLIENT_DECISION (intentos 1-2) o RETURNED forzado (intento 3+).
   */
  registerFailedAttempt: async (
    deliveryId: number,
    reason: string,
    rescheduledFor?: string,
  ): Promise<FailedAttempt & { attemptNumber: number; deliveryStatus: string; forcedReturn: boolean }> => {
    const { data } = await axiosInstance.post<{
      success: boolean;
      data: FailedAttempt & { attemptNumber: number; deliveryStatus: string; forcedReturn: boolean };
    }>(
      `/v1/logistics/deliveries/${deliveryId}/failed-attempt`,
      { reason, rescheduledFor: rescheduledFor || undefined },
    );
    return data.data;
  },
};
