import axiosInstance from './axiosInstance';

export interface PendingOrderAlert {
  id: number;
  orderId: number;
  isActive: boolean;
  createdAt: string;
}

export interface PendingOrderAlertsResponse {
  success: boolean;
  count: number;
  alerts: PendingOrderAlert[];
}

export interface AutoReturnAlert {
  id: number;
  orderId: number;
  productCount: number;
  windowHours: number;
  isActive: boolean;
  autoReturnedAt: string;
  order: {
    id: number;
    status: string;
    user: { name: string; email: string } | null;
  };
}

export const alertsService = {
  getPendingOrdersAlerts: async (): Promise<PendingOrderAlertsResponse> => {
    const { data } = await axiosInstance.get<PendingOrderAlertsResponse>('/v1/admin/alerts/pending-orders');
    return data;
  },

  getAutoReturnAlerts: async (): Promise<{ success: boolean; data: AutoReturnAlert[] }> => {
    const { data } = await axiosInstance.get('/v1/admin/alerts/auto-returns');
    return data;
  },

  dismissAutoReturnAlert: async (id: number): Promise<void> => {
    await axiosInstance.patch(`/v1/admin/alerts/auto-returns/${id}/dismiss`);
  },
};
