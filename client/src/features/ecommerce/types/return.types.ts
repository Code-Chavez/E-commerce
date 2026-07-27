export type ReturnRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type RefundType = 'CREDIT_NOTE' | 'STORE_CREDIT';

export interface ReturnItemInput {
  orderItemId: number;
  qty: number;
}

export interface ReturnRequestInput {
  orderId: number;
  reason: string;
  refundType: RefundType;
  items: ReturnItemInput[];
}

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
  status: ReturnRequestStatus;
  refundType: RefundType;
  pickupOrderId?: number | null;
  createdAt: string;
  updatedAt: string;
  items: ReturnRequestItem[];
}

export interface ReturnRequestResponse {
  success: boolean;
  data: ReturnRequest;
}
