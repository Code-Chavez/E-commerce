export interface LowRotationItem {
  variantId: string;
  sku: string | null;
  productName: string;
  attributes: Record<string, any>;
  daysWithoutMovement: number;
  lastMovementDate: string | null;
  currentStock: number;
}

export interface LowRotationResponse {
  success: boolean;
  data: LowRotationItem[];
}
