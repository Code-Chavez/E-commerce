import axiosInstance from '@/shared/api/axiosInstance';

export interface ReconciliationMatch {
  stripePaymentIntentId: string;
  orderId: string;
  stripeAmount: number;
  orderAmount: number;
  status: 'MATCHED' | 'AMOUNT_MISMATCH';
}

export interface StripePaymentIntentInfo {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: Date;
}

export interface LocalOrderInfo {
  id: string;
  total: number;
  status: string;
  paymentIntentId?: string | null;
  createdAt: Date;
}

export interface ReconciliationResult {
  matched: ReconciliationMatch[];
  unmatched: {
    stripeOnly: StripePaymentIntentInfo[];
    dbOnly: LocalOrderInfo[];
  };
}

export interface ReconcileStripeDTO {
  from: string;
  to: string;
}

export const reconciliationService = {
  reconcileStripe: async (payload: ReconcileStripeDTO): Promise<ReconciliationResult> => {
    const response = await axiosInstance.post('/v1/admin/reconcile/stripe', payload);
    return response.data.data;
  }
};
