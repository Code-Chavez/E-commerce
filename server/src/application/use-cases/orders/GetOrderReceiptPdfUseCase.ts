import prisma from '@infrastructure/database/prisma';
import { IOrderRepository } from '@domain/repositories/IOrderRepository';
import { IReceiptPdfService } from '@domain/services/IReceiptPdfService';

export class GetOrderReceiptPdfUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly receiptPdfService: IReceiptPdfService
  ) {}

  async execute(userId: number, orderId: number): Promise<NodeJS.ReadableStream> {
    // 1. Obtener la orden por ID
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Pedido no encontrado');
    }

    // 2. Verificar que pertenece al usuario autenticado
    if (order.userId !== userId) {
      throw new Error('No autorizado para ver este comprobante');
    }

    // 3. Obtener los datos del usuario/cliente
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // 4. Generar y retornar el Stream del PDF
    return this.receiptPdfService.generateReceiptPdfStream(order, user as any);
  }
}
