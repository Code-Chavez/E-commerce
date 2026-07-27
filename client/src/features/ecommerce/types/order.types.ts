export type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'FAILED' | 'RETURNED';

export type RefundStatus = 'NONE' | 'PENDING' | 'PROCESSED';

export interface AddressSnapshot {
  alias: string;
  fullAddress: string;
  district: string;
  reference?: string;
}

export interface OrderItem {
  id: number;
  variantId: number;
  qty: number;
  unitPrice: number;
  variantSku: string;
  productName: string;
}

export interface OrderStatusLog {
  id: number;
  orderId: number;
  status: OrderStatus;
  changedAt: string;
  changedBy: string;
}

export interface Order {
  id: number;
  status: OrderStatus;
  total: number;
  shippingCost: number;
  addressSnapshot: AddressSnapshot;
  paymentIntentId?: string | null;
  deliveryPin?: string | null;
  refundStatus?: RefundStatus;
  isRedelivery?: boolean;
  currentDeliveryStatus?: string | null;
  failedAttempts?: Array<{
    reason: string;
    attemptedAt: string;
    rescheduledFor?: string | null;
  }>;
  createdAt: string;
  user?: { id: number; name: string; email: string };
  items: OrderItem[];
  statusLogs?: OrderStatusLog[];
  returnRequests?: Array<{
    id: number;
    status: string;
    reason: string;
    pickupOrder?: {
      id: number;
      status: string;
      type: string;
      createdAt: string;
      updatedAt: string;
    } | null;
  }>;
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
