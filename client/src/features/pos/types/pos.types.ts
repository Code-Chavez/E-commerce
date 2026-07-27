export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'YAPE' | 'CREDIT_NOTE';
export type ReceiptType = 'BOLETA' | 'FACTURA' | 'TICKET';

export interface PosProduct {
  variantId: number;
  productId: number;
  sku: string;
  name: string;
  baseName: string;
  price: number;
  stock: number;
  attributes: Record<string, string>;
}

export interface CartItem {
  variantId: number;
  productId: number;
  sku: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  attributes: Record<string, string>;
}

export interface ClientLookupResult {
  success: boolean;
  documentNumber: string;
  name: string;
  lastName?: string;
  address?: string;
  department?: string;
  province?: string;
  district?: string;
  ubigeo?: string;
}
