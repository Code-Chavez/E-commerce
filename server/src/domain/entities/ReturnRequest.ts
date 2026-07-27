export type ReturnStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type RefundType = 'CREDIT_NOTE' | 'STORE_CREDIT';

export interface ReturnRequestItem {
  id: number;
  returnRequestId: number;
  orderItemId: number;
  qty: number;
}

export interface ReturnRequest {
  id: number;
  orderId: number;
  userId: number;
  reason: string;
  status: ReturnStatus;
  refundType: RefundType;
  pickupOrderId?: number | null;
  items?: ReturnRequestItem[];
  createdAt: Date;
  updatedAt: Date;
}
