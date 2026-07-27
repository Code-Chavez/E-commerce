import prisma from '@infrastructure/database/prisma';
import { IPaymentService } from '@domain/services/IPaymentService';
import {
  CreatePaymentIntentInputDTO,
  CreatePaymentIntentResultDTO,
} from '@application/dtos/CheckoutDTOs';
import { CalculateCheckoutUseCase } from './CalculateCheckoutUseCase';
import { CreateEcommerceOrderUseCase } from './CreateEcommerceOrderUseCase';
import { ResendEmailService } from '@infrastructure/services/ResendEmailService';
const calculateCheckoutUseCase = new CalculateCheckoutUseCase();

export class CreatePaymentIntentUseCase {
  constructor(private readonly paymentService: IPaymentService) {}

  async execute(
    input: CreatePaymentIntentInputDTO
  ): Promise<CreatePaymentIntentResultDTO> {
    const { userId, cartId, addressId, creditNoteCode } = input;

    // 1. Validar propiedad del carrito
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
    });

    if (!cart) {
      throw new Error('Carrito no encontrado');
    }

    if (cart.userId !== userId) {
      throw new Error('El carrito no pertenece al usuario autenticado');
    }

    // 2. Validar propiedad de la dirección
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new Error('Dirección no encontrada');
    }

    if (address.userId !== userId) {
      throw new Error('La dirección no pertenece al usuario autenticado');
    }

    // 3. Calcular checkout (subtotal, shippingCost, total)
    const calculation = await calculateCheckoutUseCase.execute({
      cartId,
      addressId,
    });
    let finalTotal = calculation.total;

    if (creditNoteCode) {
      const creditNote = await prisma.creditNote.findUnique({
        where: { code: creditNoteCode },
      });

      if (!creditNote) {
        throw new Error(
          `El vale de crédito con código ${creditNoteCode} no existe.`
        );
      }

      if (creditNote.type !== 'STORE_CREDIT') {
        throw new Error(
          `El código proporcionado no es un saldo a favor válido para canjear en tienda.`
        );
      }

      if (creditNote.usedAt !== null) {
        throw new Error(
          `El vale de crédito ${creditNoteCode} ya fue utilizado.`
        );
      }

      finalTotal = Math.max(0, finalTotal - Number(creditNote.amount));
    }

    // 4. Bypass Stripe si el total es <= 0
    if (finalTotal <= 0) {
      const createOrderUseCase = new CreateEcommerceOrderUseCase(
        new ResendEmailService()
      );
      const result = await createOrderUseCase.execute({
        userId,
        cartId,
        addressId,
        creditNoteCode,
      });
      return { isFree: true, orderId: result.orderId };
    }

    // 5. Crear PaymentIntent en Stripe
    // El monto debe estar en centavos (ej: S/. 100.50 -> 10050 centavos)
    const amountInCents = Math.round(finalTotal * 100);

    const { clientSecret } = await this.paymentService.createPaymentIntent(
      amountInCents,
      'pen', // soles peruanos
      {
        userId: userId.toString(),
        cartId: cartId.toString(),
        addressId: addressId.toString(),
        creditNoteCode: creditNoteCode || '', // Pasar a Stripe para que el webhook lo sepa
      }
    );

    return { clientSecret };
  }
}
