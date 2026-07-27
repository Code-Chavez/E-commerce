export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'FAILED'
  | 'RETURNED';

export type RefundStatus = 'NONE' | 'PENDING' | 'PROCESSED';

export interface OrderItem {
  id: number;
  orderId: number;
  variantId: number;
  qty: number;
  unitPrice: number;
  variantSku?: string;
  productName?: string;
}

export interface OrderStatusLog {
  id: number;
  orderId: number;
  status: OrderStatus;
  changedAt: Date;
  changedBy: string;
}

export interface Order {
  id: number;
  userId: number;
  status: OrderStatus;
  total: number;
  shippingCost: number;
  addressSnapshot: any;
  paymentIntentId: string;
  deliveryPin?: string | null;
  refundStatus?: RefundStatus;
  isRedelivery?: boolean;
  currentDeliveryStatus?: string | null;
  user?: { id: number; name: string; email: string };
  /** Intentos fallidos del último envío (para mostrar el motivo al cliente) */
  failedAttempts?: Array<{
    reason: string;
    attemptedAt: Date;
    rescheduledFor?: Date | null;
  }>;
  items?: OrderItem[];
  statusLogs?: OrderStatusLog[];
  returnRequests?: Array<{
    id: number;
    status: string;
    reason: string;
    pickupOrder?: {
      id: number;
      status: string;
      type: string;
      createdAt: Date;
      updatedAt: Date;
    } | null;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
