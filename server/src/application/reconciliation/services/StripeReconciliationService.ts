import { IStripePaymentPort } from '@domain/reconciliation/ports/IStripePaymentPort';
import { IOrderRepositoryPort } from '@domain/reconciliation/ports/IOrderRepositoryPort';
import { ReconciliationResult, ReconciliationMatch, StripePaymentIntentInfo, LocalOrderInfo } from '@domain/reconciliation/models/ReconciliationResult';

export class StripeReconciliationService {
  constructor(
    private readonly stripePaymentPort: IStripePaymentPort,
    private readonly orderRepositoryPort: IOrderRepositoryPort
  ) {}

  async execute(from: Date, to: Date): Promise<ReconciliationResult> {
    const [stripeIntents, localOrders] = await Promise.all([
      this.stripePaymentPort.getPaymentIntents(from, to),
      this.orderRepositoryPort.getOrdersByDateRange(from, to),
    ]);

    const matched: ReconciliationMatch[] = [];
    const stripeOnly: StripePaymentIntentInfo[] = [];
    const dbOnly: LocalOrderInfo[] = [];

    const ordersMap = new Map<string, LocalOrderInfo>();
    for (const order of localOrders) {
      if (order.paymentIntentId) {
        ordersMap.set(order.paymentIntentId, order);
      }
    }

    const matchedStripeIntentIds = new Set<string>();

    for (const intent of stripeIntents) {
      const order = ordersMap.get(intent.id);
      if (order) {
        const diff = Math.abs(intent.amount - order.total);
        const status = diff < 0.01 ? 'MATCHED' : 'AMOUNT_MISMATCH';

        matched.push({
          stripePaymentIntentId: intent.id,
          orderId: order.id,
          stripeAmount: intent.amount,
          orderAmount: order.total,
          status,
        });

        matchedStripeIntentIds.add(intent.id);
      } else {
        if (intent.status === 'succeeded') {
          stripeOnly.push(intent);
        }
      }
    }

    for (const order of localOrders) {
      if (order.paymentIntentId && !matchedStripeIntentIds.has(order.paymentIntentId)) {
        if (['PAID', 'SHIPPED', 'DELIVERED'].includes(order.status)) {
          dbOnly.push(order);
        }
      }
    }

    return {
      matched,
      unmatched: {
        stripeOnly,
        dbOnly,
      },
    };
  }
}
