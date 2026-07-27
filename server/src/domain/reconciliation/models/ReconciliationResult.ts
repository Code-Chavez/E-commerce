export interface StripePaymentIntentInfo {
  id: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: Date;
}

export interface LocalOrderInfo {
  id: number;
  paymentIntentId: string;
  total: number;
  status: string;
  createdAt: Date;
}

export interface ReconciliationMatch {
  stripePaymentIntentId: string;
  orderId: number;
  stripeAmount: number;
  orderAmount: number;
  status: 'MATCHED' | 'AMOUNT_MISMATCH';
}

export interface ReconciliationResult {
  matched: ReconciliationMatch[];
  unmatched: {
    stripeOnly: StripePaymentIntentInfo[];
    dbOnly: LocalOrderInfo[];
  };
}
