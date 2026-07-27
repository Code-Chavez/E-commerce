import { ProductVariant } from "./ProductVariant";

export interface LowRotationProduct {
  variantId: string;
  sku: string | null;
  productName: string;
  attributes: Record<string, any>;
  daysWithoutMovement: number;
  lastMovementDate: Date | null;
  currentStock: number;
}
