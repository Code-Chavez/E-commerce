export interface IPaymentService {
  createPaymentIntent(
    amount: number,
    currency: string,
    metadata?: Record<string, any>
  ): Promise<{ clientSecret: string; paymentIntentId: string }>;

  constructEvent(
    payload: Buffer,
    signature: string,
    secret: string
  ): any;
}
