export interface CreatePaymentIntentInputDTO {
  userId: number;
  cartId: number;
  addressId: number;
  creditNoteCode?: string;
}

export interface CreatePaymentIntentResultDTO {
  clientSecret?: string;
  isFree?: boolean;
  orderId?: number;
}

export interface ProcessWebhookInputDTO {
  payload: Buffer;
  signature: string;
}
