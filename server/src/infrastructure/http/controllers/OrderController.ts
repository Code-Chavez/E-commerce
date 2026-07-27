import { Request, Response } from 'express';
import { ListUserOrdersUseCase } from '@application/use-cases/orders/ListUserOrdersUseCase';
import { GetOrderReceiptPdfUseCase } from '@application/use-cases/orders/GetOrderReceiptPdfUseCase';
import { UpdateOrderStatusUseCase } from '@application/use-cases/orders/UpdateOrderStatusUseCase';
import { PrismaOrderRepository } from '@infrastructure/database/repositories/PrismaOrderRepository';
import { PrismaUserRepository } from '@infrastructure/database/repositories/PrismaUserRepository';
import { PrismaDeliveryRepository } from '@infrastructure/database/repositories/PrismaDeliveryRepository';
import { GeneratePickingListUseCase } from '@application/use-cases/logistics/GeneratePickingListUseCase';
import { PDFKitReceiptPdfService } from '@infrastructure/services/PDFKitReceiptPdfService';
import { ResendEmailService } from '@infrastructure/services/ResendEmailService';
import { FactilizaWhatsAppService } from '@infrastructure/services/FactilizaWhatsAppService';
import { RequestRedeliveryUseCase } from '@application/use-cases/logistics/RequestRedeliveryUseCase';
import { RequestReturnFromFailedUseCase } from '@application/use-cases/logistics/RequestReturnFromFailedUseCase';

export class OrderController {
  private prismaOrderRepository: PrismaOrderRepository;
  private prismaUserRepository: PrismaUserRepository;
  private resendEmailService: ResendEmailService;
  private pdfKitReceiptPdfService: PDFKitReceiptPdfService;
  private factilizaWhatsAppService: FactilizaWhatsAppService;
  private listUserOrdersUseCase: ListUserOrdersUseCase;
  private getOrderReceiptPdfUseCase: GetOrderReceiptPdfUseCase;
  private updateOrderStatusUseCase: UpdateOrderStatusUseCase;
  private requestRedeliveryUseCase: RequestRedeliveryUseCase;
  private requestReturnFromFailedUseCase: RequestReturnFromFailedUseCase;

  constructor() {
    this.prismaOrderRepository = new PrismaOrderRepository();
    this.prismaUserRepository = new PrismaUserRepository();
    this.resendEmailService = new ResendEmailService();
    this.pdfKitReceiptPdfService = new PDFKitReceiptPdfService();
    this.factilizaWhatsAppService = new FactilizaWhatsAppService();
    this.listUserOrdersUseCase = new ListUserOrdersUseCase(this.prismaOrderRepository);
    this.getOrderReceiptPdfUseCase = new GetOrderReceiptPdfUseCase(
      this.prismaOrderRepository,
      this.pdfKitReceiptPdfService
    );
    this.updateOrderStatusUseCase = new UpdateOrderStatusUseCase(
      this.prismaOrderRepository,
      this.prismaUserRepository,
      this.resendEmailService,
      this.factilizaWhatsAppService,
      new GeneratePickingListUseCase(new PrismaDeliveryRepository())
    );
    this.requestRedeliveryUseCase = new RequestRedeliveryUseCase(this.resendEmailService);
    this.requestReturnFromFailedUseCase = new RequestReturnFromFailedUseCase(this.resendEmailService);
  }

  async listMyOrders(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'No autorizado: Usuario no autenticado' });
        return;
      }

      const status = req.query.status as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      if (isNaN(page) || page <= 0) {
        res.status(400).json({ success: false, error: 'El parámetro page debe ser un número entero positivo' });
        return;
      }

      if (isNaN(limit) || limit <= 0) {
        res.status(400).json({ success: false, error: 'El parámetro limit debe ser un número entero positivo' });
        return;
      }

      const allowedStatus = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'FAILED', 'RETURNED'];
      if (status && !allowedStatus.includes(status)) {
        res.status(400).json({
          success: false,
          error: `Estado de pedido inválido. Los permitidos son: ${allowedStatus.join(', ')}`,
        });
        return;
      }

      const result = await this.listUserOrdersUseCase.execute({
        userId,
        status,
        page,
        limit,
      });

      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Error al listar las órdenes del cliente' });
    }
  }

  async downloadReceiptPdf(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'No autorizado: Usuario no autenticado' });
        return;
      }

      const orderId = parseInt(String(req.params.id), 10);
      if (isNaN(orderId)) {
        res.status(400).json({ success: false, error: 'El ID de pedido proporcionado no es válido' });
        return;
      }

      const pdfStream = await this.getOrderReceiptPdfUseCase.execute(userId, orderId);

      // Configurar las cabeceras HTTP para descarga de PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=comprobante-pedido-${orderId}.pdf`);

      // Canalizar el stream de lectura de PDFKit directamente a la respuesta Express
      pdfStream.pipe(res);
    } catch (error: any) {
      if (error.message.includes('No autorizado')) {
        res.status(403).json({ success: false, error: error.message });
        return;
      }
      if (error.message.includes('no encontrado') || error.message.includes('No encontrado')) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      res.status(500).json({ success: false, error: error.message || 'Error al generar el comprobante PDF' });
    }
  }

  async requestRedelivery(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'No autorizado: Usuario no autenticado' });
        return;
      }

      const orderId = parseInt(String(req.params.orderId), 10);
      if (isNaN(orderId)) {
        res.status(400).json({ success: false, error: 'El ID de pedido proporcionado no es válido' });
        return;
      }

      const result = await this.requestRedeliveryUseCase.execute({ orderId, userId });
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      if (error.message?.includes('No autorizado')) {
        res.status(403).json({ success: false, error: error.message });
        return;
      }
      if (error.message?.includes('no encontrado')) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      if (error.message?.includes('pendiente de decisión')) {
        res.status(409).json({ success: false, error: error.message });
        return;
      }
      res.status(500).json({ success: false, error: error.message || 'Error al solicitar el reenvío' });
    }
  }

  async requestReturnFromFailed(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'No autorizado: Usuario no autenticado' });
        return;
      }

      const orderId = parseInt(String(req.params.orderId), 10);
      if (isNaN(orderId)) {
        res.status(400).json({ success: false, error: 'El ID de pedido proporcionado no es válido' });
        return;
      }

      const result = await this.requestReturnFromFailedUseCase.execute({ orderId, userId });
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      if (error.message?.includes('No autorizado')) {
        res.status(403).json({ success: false, error: error.message });
        return;
      }
      if (error.message?.includes('no encontrado')) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      if (error.message?.includes('pendiente de decisión')) {
        res.status(409).json({ success: false, error: error.message });
        return;
      }
      res.status(500).json({ success: false, error: error.message || 'Error al solicitar la devolución' });
    }
  }

  async updateOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const orderId = parseInt(String(req.params.id), 10);
      if (isNaN(orderId)) {
        res.status(400).json({ success: false, error: 'El ID de pedido proporcionado no es válido' });
        return;
      }

      const { status } = req.body;
      if (!status) {
        res.status(400).json({ success: false, error: 'El estado del pedido es requerido' });
        return;
      }

      const allowedStatus = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
      if (!allowedStatus.includes(status)) {
        res.status(400).json({
          success: false,
          error: `Estado de pedido inválido. Los permitidos son: ${allowedStatus.join(', ')}`,
        });
        return;
      }

      const updatedOrder = await this.updateOrderStatusUseCase.execute(orderId, status as any);

      res.status(200).json({
        success: true,
        message: 'Estado del pedido actualizado correctamente',
        data: updatedOrder,
      });
    } catch (error: any) {
      if (error.message.includes('no encontrado') || error.message.includes('No encontrado')) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      res.status(500).json({ success: false, error: error.message || 'Error al actualizar el estado del pedido' });
    }
  }
}
