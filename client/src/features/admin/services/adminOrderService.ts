import axiosInstance from '@/shared/api/axiosInstance';
import type { Order, OrderStatus } from '@/features/ecommerce/types/order.types';

export interface AdminOrderFilters {
  status?: string;
  from?: string;
  to?: string;
  cursor?: number;
  limit?: number;
  userId?: number;
}

export interface AdminOrdersResponse {
  orders: Order[];
  nextCursor: number | null;
}

export const adminOrderService = {
  getOrders: async (filters: AdminOrderFilters): Promise<AdminOrdersResponse> => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    if (filters.cursor) params.append('cursor', filters.cursor.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.userId) params.append('userId', filters.userId.toString());

    const { data } = await axiosInstance.get<AdminOrdersResponse>(`/v1/admin/orders?${params.toString()}`);
    return data;
  },

  updateOrderStatus: async (orderId: number, status: OrderStatus): Promise<Order> => {
    const { data } = await axiosInstance.patch<Order>(`/v1/admin/orders/${orderId}/status`, { status });
    return data;
  },

  /**
   * Marca el reembolso de un pedido devuelto como procesado.
   * El reembolso se ejecuta manualmente en la pasarela; aquí solo se registra el estado.
   */
  updateRefundStatus: async (orderId: number, refundStatus: 'PENDING' | 'PROCESSED'): Promise<void> => {
    await axiosInstance.patch(`/v1/admin/orders/${orderId}/refund-status`, { refundStatus });
  },
};
