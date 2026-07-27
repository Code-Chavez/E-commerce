import { Request, Response } from 'express';
import { CalculateCheckoutUseCase } from '../../../application/use-cases/checkout/CalculateCheckoutUseCase';
import { CreatePaymentIntentUseCase } from '../../../application/use-cases/checkout/CreatePaymentIntentUseCase';
import { ProcessStripeWebhookUseCase } from '../../../application/use-cases/checkout/ProcessStripeWebhookUseCase';
import { StripePaymentService } from '../../services/StripePaymentService';
import { ResendEmailService } from '../../services/ResendEmailService';
import { GeneratePickingListUseCase } from '../../../application/use-cases/logistics/GeneratePickingListUseCase';
import { PrismaDeliveryRepository } from '../../database/repositories/PrismaDeliveryRepository';

export class CheckoutController {
  private stripePaymentService: StripePaymentService;
  private calculateCheckoutUseCase: CalculateCheckoutUseCase;
  private createPaymentIntentUseCase: CreatePaymentIntentUseCase;
  private processStripeWebhookUseCase: ProcessStripeWebhookUseCase;

  constructor() {
    this.stripePaymentService = new StripePaymentService();
    this.calculateCheckoutUseCase = new CalculateCheckoutUseCase();
    this.createPaymentIntentUseCase = new CreatePaymentIntentUseCase(this.stripePaymentService);
    this.processStripeWebhookUseCase = new ProcessStripeWebhookUseCase(
      this.stripePaymentService,
      new ResendEmailService(),
      new GeneratePickingListUseCase(new PrismaDeliveryRepository())
    );
  }

  async calculate(req: Request, res: Response): Promise<void> {
    try {
      const { cartId, addressId } = req.body;

      if (!cartId || !addressId) {
        res.status(400).json({ success: false, error: 'cartId y addressId son requeridos' });
        return;
      }

      const result = await this.calculateCheckoutUseCase.execute({ cartId, addressId });

      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      if (error.message.includes('cobertura') || error.message.includes('encontrado') || error.message.includes('encontrada')) {
        res.status(400).json({ success: false, error: error.message });
        return;
      }
      res.status(500).json({ success: false, error: 'Error interno del servidor al calcular checkout' });
    }
  }

  async createPaymentIntent(req: Request, res: Response): Promise<void> {
    try {
      const { cartId, addressId, creditNoteCode } = req.body;
      const userId = req.auth?.userId;

      if (!userId) {
        res.status(401).json({ success: false, error: 'No autorizado: Usuario no autenticado' });
        return;
      }

      if (!cartId || !addressId) {
        res.status(400).json({ success: false, error: 'cartId y addressId son requeridos' });
        return;
      }

      const result = await this.createPaymentIntentUseCase.execute({
        userId,
        cartId: Number(cartId),
        addressId: Number(addressId),
        creditNoteCode,
      });

      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      if (
        error.message.includes('pertenece') ||
        error.message.includes('encontrado') ||
        error.message.includes('cobertura') ||
        error.message.includes('encontrada')
      ) {
        res.status(400).json({ success: false, error: error.message });
        return;
      }
      res.status(500).json({ success: false, error: error.message || 'Error al crear el PaymentIntent de Stripe' });
    }
  }

  async webhook(req: Request, res: Response): Promise<void> {
    const signature = req.headers['stripe-signature'] as string;
    const payload = req.rawBody;

    if (!signature || !payload) {
      res.status(400).json({ success: false, error: 'Firma o payload del webhook faltante' });
      return;
    }

    try {
      const result = await this.processStripeWebhookUseCase.execute({
        payload,
        signature,
      });

      res.status(200).json({ received: true, processed: result.processed, orderId: result.orderId });
    } catch (error: any) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('Error en Stripe webhook handler:', error.message);
      }
      res.status(400).json({ success: false, error: error.message });
    }
  }
}
