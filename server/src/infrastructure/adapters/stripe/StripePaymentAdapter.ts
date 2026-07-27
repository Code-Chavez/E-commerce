import Stripe from 'stripe';
import { IStripePaymentPort } from '@domain/reconciliation/ports/IStripePaymentPort';
import { StripePaymentIntentInfo } from '@domain/reconciliation/models/ReconciliationResult';

export class StripePaymentAdapter implements IStripePaymentPort {
  private stripe: Stripe;

  constructor() {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY no está configurada');
    }
    this.stripe = new Stripe(apiKey, {
      apiVersion: '2023-10-16' as any,
      maxNetworkRetries: 3,
    });
  }

  async getPaymentIntents(from: Date, to: Date): Promise<StripePaymentIntentInfo[]> {
    const paymentIntents: StripePaymentIntentInfo[] = [];
    const gte = Math.floor(from.getTime() / 1000);
    const lte = Math.floor(to.getTime() / 1000);

    for await (const intent of this.stripe.paymentIntents.list({
      created: { gte, lte },
      limit: 100,
    })) {
      paymentIntents.push({
        id: intent.id,
        amount: intent.amount / 100,
        currency: intent.currency,
        status: intent.status,
        createdAt: new Date(intent.created * 1000),
      });
    }

    return paymentIntents;
  }
}
