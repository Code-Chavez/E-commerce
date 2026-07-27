import axiosInstance from '@/shared/api/axiosInstance';

export interface SubscribeNewsletterData {
  email: string;
}

export interface NewsletterResponse {
  success: boolean;
  data?: {
    id: number;
    email: string;
    isActive: boolean;
    subscribedAt: string;
  };
  error?: string;
}

export const newsletterService = {
  subscribe: async (data: SubscribeNewsletterData): Promise<NewsletterResponse> => {
    const response = await axiosInstance.post('/v1/newsletter/subscribe', data);
    return response.data;
  },

  unsubscribe: async (email: string): Promise<NewsletterResponse> => {
    const response = await axiosInstance.delete('/v1/newsletter/unsubscribe', {
      data: { email }
    });
    return response.data;
  }
};
