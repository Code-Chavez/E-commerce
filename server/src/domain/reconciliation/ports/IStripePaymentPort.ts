import { StripePaymentIntentInfo } from '../models/ReconciliationResult';

export interface IStripePaymentPort {
  getPaymentIntents(from: Date, to: Date): Promise<StripePaymentIntentInfo[]>;
}
