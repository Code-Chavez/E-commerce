import prisma from '@infrastructure/database/prisma';
import { IPaymentService } from '@domain/services/IPaymentService';
import { IEmailService } from '@domain/services/IEmailService';
import { ProcessWebhookInputDTO } from '@application/dtos/CheckoutDTOs';
import { CreateEcommerceOrderUseCase } from './CreateEcommerceOrderUseCase';
import { GeneratePickingListUseCase } from '../logistics/GeneratePickingListUseCase';

export class ProcessStripeWebhookUseCase {
  constructor(
    private readonly paymentService: IPaymentService,
    private readonly emailService?: IEmailService,
    private readonly generatePickingListUseCase?: GeneratePickingListUseCase
  ) {}

  async execute(
    input: ProcessWebhookInputDTO
  ): Promise<{ processed: boolean; orderId?: number }> {
    const { payload, signature } = input;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET no está configurada');
    }

    // 1. Construir el evento y verificar la firma de Stripe
    let event: any;
    try {
      event = this.paymentService.constructEvent(
        payload,
        signature,
        webhookSecret
      );
    } catch (err: any) {
      throw new Error(`Error de firma en Webhook de Stripe: ${err.message}`);
    }

    // 2. Procesar el evento payment_intent.succeeded
    if (event.type !== 'payment_intent.succeeded') {
      return { processed: false };
    }

    const paymentIntent = event.data.object;
    const paymentIntentId = paymentIntent.id;
    const metadata = paymentIntent.metadata;

    if (
      !metadata ||
      !metadata.userId ||
      !metadata.cartId ||
      !metadata.addressId
    ) {
      throw new Error(
        'Metadatos insuficientes en el PaymentIntent para procesar la orden'
      );
    }

    const userId = parseInt(metadata.userId, 10);
    const cartId = parseInt(metadata.cartId, 10);
    const addressId = parseInt(metadata.addressId, 10);

    // 3. Idempotencia: Verificar si la orden ya existe
    const existingOrder = await prisma.order.findUnique({
      where: { paymentIntentId },
    });

    if (existingOrder) {
      console.log(
        `Orden ya procesada anteriormente para el paymentIntentId: ${paymentIntentId}`
      );
      return { processed: true, orderId: existingOrder.id };
    }

    // 4. Invocar el caso de uso compartido para crear la orden
    const createEcommerceOrderUseCase = new CreateEcommerceOrderUseCase(
      this.emailService
    );

    // Si la nota de crédito fue pasada en la metadata, aplicarla
    const creditNoteCode = metadata.creditNoteCode || undefined;

    const result = await createEcommerceOrderUseCase.execute({
      userId,
      cartId,
      addressId,
      paymentIntentId,
      creditNoteCode,
    });

    // I) Auto-generar lista de picking
    if (this.generatePickingListUseCase) {
      try {
        await this.generatePickingListUseCase.execute([result.orderId]);
      } catch (pickingError) {
        console.error(
          `Failed to automatically generate picking list for order #${result.orderId}:`,
          pickingError
        );
      }
    }

    return { processed: true, orderId: result.orderId };
  }
}
