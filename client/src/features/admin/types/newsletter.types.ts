export interface NewsletterSubscriber {
  id: number;
  email: string;
  isActive: boolean;
  subscribedAt: string;
}

export interface NewsletterSubscribersResponse {
  success: boolean;
  data: NewsletterSubscriber[];
  total: number;
  page: number;
  limit: number;
}

export type ExportFormat = 'csv' | 'excel';
