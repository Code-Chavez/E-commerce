export interface FailedAttempt {
  id: number;
  deliveryId: number;
  reason: string;
  attemptedAt: string;
  rescheduledFor: string | null;
}

export interface PickingItem {
  id: number;
  deliveryId: number;
  variantId: number;
  qty: number;
  pickedAt: string | null;
  variantSku: string;
  productName: string;
}

export type DeliveryType = 'DELIVERY' | 'PICKUP';

export interface Delivery {
  id: number;
  orderId: number;
  deliveryManId: number | null;
  status: 'PENDING' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED' | 'FAILED' | 'AWAITING_CLIENT_DECISION' | 'RETURNED';
  type?: DeliveryType;
  returnRequestId?: number | null;
  parentDeliveryId?: number | null;
  createdAt: string;
  updatedAt: string;
  pickingItems: PickingItem[];
  failedAttempts?: FailedAttempt[];
  deliveryPhotoUrl?: string | null;
  deliveredAt?: string | null;
  orderUser?: {
    id: number;
    name: string;
    email: string;
  };
  orderAddress?: any;
}

export interface PickingResponse {
  success: boolean;
  count: number;
  data: Delivery[];
}

export interface AssignDeliveryManResponse {
  success: boolean;
  data: Delivery;
}

// Para mock data y UI state
export interface OrderToPick {
  id: number;
  orderId: number;
  customerName: string;
  itemsCount: number;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export interface DeliveryMan {
  id: number;
  name: string;
  email: string;
}

export interface DeliveryZone {
  id: number;
  districts: string[];
  deliveryCost: number;
  estimatedDays: number;
  name?: string;
}

export interface DeliveriesByZoneGroup {
  zone: DeliveryZone;
  count: number;
  deliveries: Delivery[];
}
