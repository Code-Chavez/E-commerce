import axiosInstance from '@/shared/api/axiosInstance';

export interface ApproveReturnResponse {
  id: number;
  status: string;
  pickupOrderId: number;
}

export const adminReturnService = {
  approveReturn: async (returnId: number): Promise<ApproveReturnResponse> => {
    const { data } = await axiosInstance.patch(`/v1/admin/returns/${returnId}/approve`);
    return data.data;
  },
  
  rejectReturn: async (returnId: number): Promise<void> => {
    await axiosInstance.patch(`/v1/admin/returns/${returnId}/reject`);
  },

  listReturns: async (): Promise<any[]> => {
    const response = await axiosInstance.get(`/v1/admin/returns`);
    return response.data.data;
  },

  issueCreditNote: async (returnId: number): Promise<void> => {
    await axiosInstance.post(`/v1/admin/returns/${returnId}/credit-note`);
  }
};
