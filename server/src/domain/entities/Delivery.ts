export type DeliveryStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'FAILED'
  | 'AWAITING_CLIENT_DECISION'
  | 'RETURNED';

export interface PickingItem {
  id: number;
  deliveryId: number;
  variantId: number;
  qty: number;
  pickedAt?: Date | null;
  variantSku?: string;
  productName?: string;
}

export interface FailedDeliveryAttempt {
  id: number;
  deliveryId: number;
  reason: string;
  attemptedAt: Date;
  rescheduledFor?: Date | null;
}

export interface Delivery {
  id: number;
  orderId: number;
  deliveryManId?: number | null;
  status: DeliveryStatus;
  type: 'DELIVERY' | 'PICKUP';
  returnRequestId?: number | null;
  parentDeliveryId?: number | null;
  deliveryPhotoUrl?: string | null;
  deliveredAt?: Date | null;
  pickingItems?: PickingItem[];
  failedAttempts?: FailedDeliveryAttempt[];
  createdAt: Date;
  updatedAt: Date;
}
