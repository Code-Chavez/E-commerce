export interface Credit {
  id: string;
  totalAmount: number;
  pendingBalance: number;
  dueDate: string;
  installments: number;
}

export interface PendingBalanceResponse {
  clientId: number;
  totalPendingBalance: number;
  credits: Credit[];
}

export interface CreditPayment {
  id: string;
  creditId: string;
  amount: number;
  paidAt: string;
}

export interface PaymentRequest {
  amount: number;
}
