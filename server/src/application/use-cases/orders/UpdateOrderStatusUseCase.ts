import { IOrderRepository } from '@domain/repositories/IOrderRepository';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { IEmailService } from '@domain/services/IEmailService';
import { IWhatsAppService } from '@domain/services/IWhatsAppService';
import { Order, OrderStatus } from '@domain/entities/Order';
import { GeneratePickingListUseCase } from '../logistics/GeneratePickingListUseCase';

const STATUS_TRANSLATIONS: Record<OrderStatus, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  SHIPPED: 'En Camino (Enviado)',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
  FAILED: 'Entrega Fallida',
  RETURNED: 'Devuelto',
};

export class UpdateOrderStatusUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly userRepository: IUserRepository,
    private readonly emailService: IEmailService,
    private readonly whatsappService: IWhatsAppService,
    private readonly generatePickingListUseCase?: GeneratePickingListUseCase
  ) {}

  async execute(orderId: number, status: OrderStatus): Promise<Order> {
    // 1. Fetch the order
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Pedido no encontrado');
    }

    // 2. Update the status
    const updatedOrder = await this.orderRepository.updateStatus(orderId, status);

    // 2.5 Auto-generate picking list if status is PAID
    if (status === 'PAID' && this.generatePickingListUseCase) {
      try {
        await this.generatePickingListUseCase.execute([orderId]);
      } catch (pickingError) {
        console.error(`Failed to automatically generate picking list for order #${orderId}:`, pickingError);
      }
    }

    // 3. Retrieve user to get their email address
    const user = await this.userRepository.findById(order.userId);
    if (user && user.email) {
      const statusNameEs = STATUS_TRANSLATIONS[status] || status;
      const userName = user.name || 'Cliente';

      const emailSubject = `Actualización de tu Pedido #${order.id} — D'Mendoza`;
      const emailHtml = `
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
  </head>
  <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 24px; margin: 0;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px; border: 1px solid #e0e0e0;">
      <h2 style="color: #3f3f3f; margin-top: 0;">¡Hola ${userName}!</h2>
      <p style="color: #555; font-size: 15px; line-height: 1.6;">
        Queremos informarte que el estado de tu pedido <strong>#${order.id}</strong> ha sido actualizado.
      </p>
      
      <div style="background-color: #f7f7f5; border-radius: 6px; padding: 20px; margin: 24px 0; text-align: center; border-left: 4px solid #3f3f3f;">
        <span style="color: #6b6b6b; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px;">Nuevo Estado</span>
        <strong style="color: #3f3f3f; font-size: 20px; font-weight: bold;">${statusNameEs}</strong>
      </div>
      
      <p style="color: #555; font-size: 15px; line-height: 1.6;">
        Puedes realizar el seguimiento de tu pedido en cualquier momento ingresando a tu cuenta en nuestra tienda online.
      </p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="http://localhost:5173/profile" 
           style="background-color: #3f3f3f; color: #ffffff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-size: 15px; font-weight: bold; display: inline-block;">
          Ver mi Pedido
        </a>
      </div>
      
      <p style="color: #888; font-size: 12px; border-top: 1px solid #eeeeee; padding-top: 20px; margin-top: 32px; text-align: center;">
        Este es un correo automático enviado por D'Mendoza S.A.C. Por favor no respondas a este mensaje.
      </p>
    </div>
  </body>
</html>
      `;

      try {
        await this.emailService.sendEmail(user.email, emailSubject, emailHtml.trim());
      } catch (emailError) {
        // We log email failures but don't crash the operation to maintain robust API response
        console.error(`Failed to send order status email notification for order #${order.id}:`, emailError);
      }

      // 4. Send WhatsApp Notification if applicable and phone exists
      if ((status === 'PAID' || status === 'SHIPPED') && user.phone) {
        try {
          await this.whatsappService.sendMessage(
            user.phone,
            `ORDER_STATUS_${status}`,
            {
              orderId: String(order.id),
              status: statusNameEs,
            }
          );
        } catch (whatsappError) {
          console.error(`Failed to send order status WhatsApp notification for order #${order.id}:`, whatsappError);
        }
      }
    }

    return updatedOrder;
  }
}
