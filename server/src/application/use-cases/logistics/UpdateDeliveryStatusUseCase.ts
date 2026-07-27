import { IDeliveryRepository } from '@domain/repositories/IDeliveryRepository';
import { IEmailService } from '@domain/services/IEmailService';
import { DeliveryStateMachine } from '@domain/services/DeliveryStateMachine';
import { Delivery } from '@domain/entities/Delivery';

export class UpdateDeliveryStatusUseCase {
  constructor(
    private readonly deliveryRepository: IDeliveryRepository,
    private readonly emailService: IEmailService
  ) {}

  async execute(deliveryId: number, newStatus: string): Promise<Delivery> {
    const delivery = await this.deliveryRepository.findById(deliveryId);

    if (!delivery) {
      throw new Error(`Delivery with ID ${deliveryId} not found`);
    }

    // Domain validation rules for state transitions
    DeliveryStateMachine.validateTransition(delivery.status, newStatus);

    // Update in Database
    const updatedDelivery = await this.deliveryRepository.updateStatus(deliveryId, newStatus);

    // If there is an associated customer email, send a notification
    const customerEmail = (updatedDelivery as any).orderUser?.email;
    const customerName = (updatedDelivery as any).orderUser?.name || 'Cliente';

    if (customerEmail) {
      await this.sendNotificationEmail(customerEmail, customerName, newStatus, updatedDelivery.orderId);
    }

    return updatedDelivery;
  }

  private async sendNotificationEmail(to: string, name: string, status: string, orderId: number): Promise<void> {
    let subject = `Actualización de su pedido #${orderId}`;
    let message = `<p>Hola ${name},</p><p>El estado de su envío ha sido actualizado.</p>`;

    switch (status) {
      case 'IN_TRANSIT':
        subject = `Su pedido #${orderId} está en camino`;
        message = `<p>Hola ${name},</p><p>¡Buenas noticias! Su pedido #${orderId} ya está en camino hacia su dirección de entrega.</p>`;
        break;
      case 'DELIVERED':
        subject = `Su pedido #${orderId} ha sido entregado`;
        message = `<p>Hola ${name},</p><p>Su pedido #${orderId} ha sido entregado con éxito. ¡Gracias por confiar en nosotros!</p>`;
        break;
      case 'FAILED':
        subject = `Inconveniente con la entrega de su pedido #${orderId}`;
        message = `<p>Hola ${name},</p><p>Hemos tenido un inconveniente al intentar entregar su pedido #${orderId}. Por favor contáctenos para coordinar una solución.</p>`;
        break;
      case 'RETURNED':
        subject = `Su pedido #${orderId} ha sido devuelto`;
        message = `<p>Hola ${name},</p><p>Su pedido #${orderId} ha sido devuelto a nuestras instalaciones.</p>`;
        break;
    }

    const html = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px;">
        <h2 style="color: #0056b3;">D'Mendoza Web - Actualización de Envío</h2>
        ${message}
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #777;">Este es un mensaje automático, por favor no responda a este correo.</p>
      </div>
    `;

    try {
      await this.emailService.sendEmail(to, subject, html);
    } catch (error) {
      // In production, we should log this properly. We don't throw to not break the transaction flow.
      console.error(`Failed to send status update email to ${to}:`, error);
    }
  }
}
