import prisma from '@infrastructure/database/prisma';
import { IEmailService } from '@domain/services/IEmailService';

interface CreateEcommerceOrderInput {
  userId: number;
  cartId: number;
  addressId: number;
  paymentIntentId?: string;
  creditNoteCode?: string;
}

export class CreateEcommerceOrderUseCase {
  constructor(private readonly emailService?: IEmailService) {}

  async execute(input: CreateEcommerceOrderInput): Promise<{ orderId: number; deliveryPin: string }> {
    const { userId, cartId, addressId, paymentIntentId, creditNoteCode } = input;

    const orderId = await prisma.$transaction(async (tx) => {
      // A) Obtener el carrito y sus ítems
      const cart = await tx.cart.findUnique({
        where: { id: cartId },
        include: {
          items: {
            include: {
              variant: true,
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new Error('El carrito está vacío o no existe');
      }

      // B) Obtener la dirección para la orden y calcular el costo de envío
      const address = await tx.address.findUnique({
        where: { id: addressId },
      });

      if (!address) {
        throw new Error('La dirección de envío no existe');
      }

      // Obtener el costo de delivery
      const deliveryZones = await tx.deliveryZone.findMany();
      let shippingCost = 0;
      let hasCoverage = false;

      for (const zone of deliveryZones) {
        const districtsArray = zone.districts as string[];
        if (Array.isArray(districtsArray) && districtsArray.includes(address.district)) {
          shippingCost = Number(zone.deliveryCost);
          hasCoverage = true;
          break;
        }
      }

      if (!hasCoverage) {
        throw new Error(`Sin cobertura de envío para el distrito: ${address.district}`);
      }

      // C) Calcular subtotal de los ítems
      let subtotal = 0;
      for (const item of cart.items) {
        const itemPrice = Number(item.variant.price);
        const itemDiscount = item.variant.discountPercent || 0;
        
        const finalPrice = itemDiscount > 0 
          ? itemPrice - (itemPrice * itemDiscount) / 100 
          : itemPrice;
          
        subtotal += finalPrice * item.quantity;
      }
      let total = subtotal + shippingCost;

      // C.2) Validar y aplicar Vale de Crédito
      if (creditNoteCode) {
        const creditNote = await tx.creditNote.findUnique({
          where: { code: creditNoteCode }
        });

        if (!creditNote) {
          throw new Error(`El vale de crédito con código ${creditNoteCode} no existe.`);
        }

        if (creditNote.type !== 'STORE_CREDIT') {
          throw new Error(`El código proporcionado no es un saldo a favor válido para canjear en tienda.`);
        }

        if (creditNote.usedAt !== null) {
          throw new Error(`El vale de crédito ${creditNoteCode} ya fue utilizado.`);
        }

        // Marcar el vale como usado
        const updated = await tx.creditNote.updateMany({
          where: { code: creditNoteCode, usedAt: null },
          data: { usedAt: new Date() }
        });

        if (updated.count !== 1) {
          throw new Error(`El vale de crédito ${creditNoteCode} ya fue utilizado concurrentemente.`);
        }

        total = Math.max(0, total - Number(creditNote.amount));
      }

      // Crear el addressSnapshot para guardar el estado histórico de la dirección
      const addressSnapshot = {
        alias: address.alias,
        fullAddress: address.fullAddress,
        district: address.district,
        reference: address.reference,
      };

      // D) Obtener la sucursal principal para descontar stock
      let mainBranch = await tx.branch.findFirst({
        where: { isMain: true, isActive: true },
      });

      if (!mainBranch) {
        mainBranch = await tx.branch.findFirst({
          where: { isActive: true },
          orderBy: { id: 'asc' },
        });
      }

      if (!mainBranch) {
        throw new Error('No se encontró ninguna sucursal activa para despachar el stock');
      }

      // E) Crear la Orden con PIN de seguridad de 6 dígitos
      const deliveryPin = String(Math.floor(100000 + Math.random() * 900000));

      const order = await tx.order.create({
        data: {
          userId,
          status: 'PAID',
          total,
          shippingCost,
          addressSnapshot,
          paymentIntentId: paymentIntentId || `FREE_ORDER_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          deliveryPin,
        },
      });

      // F) Crear OrderItems, actualizar stock y generar Kardex por cada item
      for (const item of cart.items) {
        // Calcular precio final con descuento
        const itemPrice = Number(item.variant.price);
        const itemDiscount = item.variant.discountPercent || 0;
        
        const finalPrice = itemDiscount > 0 
          ? itemPrice - (itemPrice * itemDiscount) / 100 
          : itemPrice;

        // Crear OrderItem
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            variantId: item.variantId,
            qty: item.quantity,
            unitPrice: finalPrice,
          },
        });

        // Verificar y actualizar stock de la sucursal principal
        const stock = await tx.branchStock.findUnique({
          where: {
            variantId_branchId_status: {
              variantId: item.variantId,
              branchId: mainBranch.id,
              status: 'AVAILABLE',
            },
          },
        });

        if (!stock || stock.quantity < item.quantity) {
          throw new Error(`Stock insuficiente en sucursal principal para el SKU: ${item.variant.sku}`);
        }

        const newQty = stock.quantity - item.quantity;

        // Decrementar el stock
        await tx.branchStock.update({
          where: {
            variantId_branchId_status: {
              variantId: item.variantId,
              branchId: mainBranch.id,
              status: 'AVAILABLE',
            },
          },
          data: {
            quantity: newQty,
          },
        });

        // Obtener el costo unitario desde el último asiento de Kardex
        const lastKardex = await tx.kardexEntry.findFirst({
          where: { variantId: item.variantId, branchId: mainBranch.id },
          orderBy: { id: 'desc' },
        });

        const unitCost = lastKardex?.unitCost ?? 0;
        const lastBalanceCost = lastKardex?.balanceCost ?? 0;
        const newBalanceCost = lastBalanceCost - item.quantity * unitCost;

        // Crear asiento Kardex SALIDA
        await tx.kardexEntry.create({
          data: {
            variantId: item.variantId,
            branchId: mainBranch.id,
            type: 'VENTA',
            quantity: item.quantity,
            unitCost,
            balanceQty: newQty,
            balanceCost: newBalanceCost,
            userId: userId ?? null,
          },
        });
      }

      // G) Limpiar el carrito de compras (vaciar CartItems)
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      // G.2) Calcular y otorgar puntos de fidelidad (HU-078)
      // La fidelidad se debe calcular basada en el monto real pagado total.
      const loyaltyConfig = await tx.loyaltyConfig.findFirst({
        where: { isActive: true },
      });

      if (loyaltyConfig && loyaltyConfig.solesPerPoint) {
        const solesPerPoint = Number(loyaltyConfig.solesPerPoint);
        if (solesPerPoint > 0 && total > 0) {
          const pointsEarned = Math.floor(total / solesPerPoint);

          if (pointsEarned > 0) {
            await tx.loyaltyAccount.upsert({
              where: { userId },
              create: {
                userId,
                balance: pointsEarned,
              },
              update: {
                balance: { increment: pointsEarned },
              },
            });
          }
        }
      }

      return { orderId: order.id, deliveryPin, userId };
    });

    // H) Enviar email de confirmación de pago con el PIN de seguridad
    if (this.emailService) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: orderId.userId },
          select: { email: true, name: true },
        });

        if (user?.email) {
          const userName = user.name || 'Cliente';
          const html = `
<!DOCTYPE html>
<html lang="es">
  <head><meta charset="UTF-8" /></head>
  <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 24px; margin: 0;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px; border: 1px solid #e0e0e0;">
      <h2 style="color: #3f3f3f; margin-top: 0;">¡Gracias por tu compra, ${userName}!</h2>
      <p style="color: #555; font-size: 15px; line-height: 1.6;">
        Tu pago para el pedido <strong>#${orderId.orderId}</strong> ha sido confirmado exitosamente.
      </p>
      <p style="color: #555; font-size: 15px; line-height: 1.6;">
        Al momento de recibir tu pedido, el repartidor te solicitará el siguiente
        <strong>PIN de seguridad de 6 dígitos</strong> para confirmar la entrega:
      </p>
      <div style="background-color: #f7f7f5; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center; border: 2px dashed #3f3f3f;">
        <span style="color: #6b6b6b; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; display: block; margin-bottom: 8px;">Tu PIN de Entrega</span>
        <strong style="color: #3f3f3f; font-size: 36px; font-weight: 900; letter-spacing: 8px;">${orderId.deliveryPin}</strong>
      </div>
      <p style="color: #888; font-size: 13px; line-height: 1.5;">
        Guarda este PIN de forma segura. No lo compartas con nadie que no sea el repartidor oficial de E-Commerce al momento de la entrega.
      </p>
      <p style="color: #888; font-size: 12px; border-top: 1px solid #eeeeee; padding-top: 20px; margin-top: 32px; text-align: center;">
        Este es un correo automático enviado por E-Commerce S.A.C. Por favor no respondas a este mensaje.
      </p>
    </div>
  </body>
</html>`;
          await this.emailService.sendEmail(
            user.email,
            `Confirmación de pago — Pedido #${orderId.orderId} | PIN de entrega`,
            html.trim(),
          );
        }
      } catch (emailErr) {
        console.error(`Error enviando email de confirmación con PIN para orden #${orderId.orderId}:`, emailErr);
      }
    }

    return { orderId: orderId.orderId, deliveryPin: orderId.deliveryPin };
  }
}
