import { Request, Response, NextFunction } from 'express';
import { PrismaDeliveryRepository } from '@infrastructure/database/repositories/PrismaDeliveryRepository';
import { PrismaUserRepository } from '@infrastructure/database/repositories/PrismaUserRepository';
import { PrismaOrderRepository } from '@infrastructure/database/repositories/PrismaOrderRepository';
import { PrismaDeliveryZoneRepository } from '@infrastructure/database/repositories/PrismaDeliveryZoneRepository';
import prisma from '@infrastructure/database/prisma';
import { PdfKitShippingLabelService } from '@infrastructure/services/PdfKitShippingLabelService';
import { GeneratePickingListUseCase } from '@application/use-cases/logistics/GeneratePickingListUseCase';
import { AssignDeliveryManUseCase } from '@application/use-cases/logistics/AssignDeliveryManUseCase';
import { GenerateShippingLabelUseCase } from '@application/use-cases/logistics/GenerateShippingLabelUseCase';
import { GetPendingOrdersUseCase } from '@application/use-cases/logistics/GetPendingOrdersUseCase';
import { GetDeliveriesUseCase } from '@application/use-cases/logistics/GetDeliveriesUseCase';
import { GetDeliveryMenUseCase } from '@application/use-cases/logistics/GetDeliveryMenUseCase';
import { UpdateDeliveryStatusUseCase } from '@application/use-cases/logistics/UpdateDeliveryStatusUseCase';
import { RegisterFailedAttemptUseCase } from '@application/use-cases/logistics/RegisterFailedAttemptUseCase';
import { ConfirmDeliveryUseCase } from '@application/use-cases/logistics/ConfirmDeliveryUseCase';
import { GetPendingDeliveriesByZoneUseCase } from '@application/use-cases/logistics/GetPendingDeliveriesByZoneUseCase';
import { ReturnDeliveryUseCase } from '@application/use-cases/logistics/ReturnDeliveryUseCase';
import { ValidateDeliveryPinUseCase } from '@application/use-cases/logistics/ValidateDeliveryPinUseCase';
import { CloudinaryStorageService } from '@infrastructure/services/CloudinaryStorageService';
import { ResendEmailService } from '@infrastructure/services/ResendEmailService';
import { InvalidDeliveryStateTransitionError } from '@domain/errors/InvalidDeliveryStateTransitionError';

export class LogisticsController {
  private generatePickingListUseCase: GeneratePickingListUseCase;
  private assignDeliveryManUseCase: AssignDeliveryManUseCase;
  private generateShippingLabelUseCase: GenerateShippingLabelUseCase;
  private getPendingOrdersUseCase: GetPendingOrdersUseCase;
  private getDeliveriesUseCase: GetDeliveriesUseCase;
  private getDeliveryMenUseCase: GetDeliveryMenUseCase;
  private updateDeliveryStatusUseCase: UpdateDeliveryStatusUseCase;
  private registerFailedAttemptUseCase: RegisterFailedAttemptUseCase;
  private confirmDeliveryUseCase: ConfirmDeliveryUseCase;
  private getPendingDeliveriesByZoneUseCase: GetPendingDeliveriesByZoneUseCase;
  private returnDeliveryUseCase: ReturnDeliveryUseCase;
  private validateDeliveryPinUseCase: ValidateDeliveryPinUseCase;
  private storageService: CloudinaryStorageService;

  constructor() {
    const deliveryRepo = new PrismaDeliveryRepository();
    const userRepo = new PrismaUserRepository();
    const orderRepo = new PrismaOrderRepository();
    const deliveryZoneRepo = new PrismaDeliveryZoneRepository(prisma);
    const shippingLabelService = new PdfKitShippingLabelService();
    const emailService = new ResendEmailService();

    this.generatePickingListUseCase = new GeneratePickingListUseCase(
      deliveryRepo
    );
    this.assignDeliveryManUseCase = new AssignDeliveryManUseCase(
      deliveryRepo,
      userRepo
    );
    this.generateShippingLabelUseCase = new GenerateShippingLabelUseCase(
      deliveryRepo,
      orderRepo,
      shippingLabelService
    );
    this.getPendingOrdersUseCase = new GetPendingOrdersUseCase(deliveryRepo);
    this.getDeliveriesUseCase = new GetDeliveriesUseCase(deliveryRepo);
    this.getDeliveryMenUseCase = new GetDeliveryMenUseCase(userRepo);
    this.updateDeliveryStatusUseCase = new UpdateDeliveryStatusUseCase(
      deliveryRepo,
      emailService
    );
    this.registerFailedAttemptUseCase = new RegisterFailedAttemptUseCase(
      emailService
    );
    this.confirmDeliveryUseCase = new ConfirmDeliveryUseCase();
    this.getPendingDeliveriesByZoneUseCase =
      new GetPendingDeliveriesByZoneUseCase(deliveryRepo, deliveryZoneRepo);
    this.returnDeliveryUseCase = new ReturnDeliveryUseCase();
    this.validateDeliveryPinUseCase = new ValidateDeliveryPinUseCase();
    this.storageService = new CloudinaryStorageService();
  }

  picking = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { orderIds } = req.body || {};
      const deliveries = await this.generatePickingListUseCase.execute(
        orderIds ? orderIds.map(Number) : undefined
      );
      res
        .status(201)
        .json({ success: true, count: deliveries.length, data: deliveries });
    } catch (error) {
      next(error);
    }
  };

  getPendingOrders = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const orders = await this.getPendingOrdersUseCase.execute();
      res
        .status(200)
        .json({ success: true, count: orders.length, data: orders });
    } catch (error) {
      next(error);
    }
  };

  getPendingDeliveriesByZone = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const groupedDeliveries =
        await this.getPendingDeliveriesByZoneUseCase.execute();
      res.status(200).json({ success: true, data: groupedDeliveries });
    } catch (error) {
      next(error);
    }
  };

  getDeliveries = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { status } = req.query;
      const deliveries = await this.getDeliveriesUseCase.execute(
        status as string | undefined
      );
      res
        .status(200)
        .json({ success: true, count: deliveries.length, data: deliveries });
    } catch (error) {
      next(error);
    }
  };

  getDeliveryMen = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const deliveryMen = await this.getDeliveryMenUseCase.execute();
      res
        .status(200)
        .json({ success: true, count: deliveryMen.length, data: deliveryMen });
    } catch (error) {
      next(error);
    }
  };

  assign = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const deliveryId = Number(req.params.id);
      const { deliveryManId } = req.body;

      if (isNaN(deliveryId) || !deliveryManId || isNaN(Number(deliveryManId))) {
        res.status(400).json({
          success: false,
          error: 'Invalid delivery ID or deliveryManId',
        });
        return;
      }

      const delivery = await this.assignDeliveryManUseCase.execute(
        deliveryId,
        Number(deliveryManId)
      );
      res.status(200).json({ success: true, data: delivery });
    } catch (error: any) {
      if (
        error.message?.includes('not found') ||
        error.message?.includes('no encontrado')
      ) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      res.status(400).json({ success: false, error: error.message });
    }
  };

  getLabel = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const deliveryId = Number(req.params.id);

      if (isNaN(deliveryId)) {
        res.status(400).json({ success: false, error: 'Invalid delivery ID' });
        return;
      }

      const stream =
        await this.generateShippingLabelUseCase.execute(deliveryId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="shipping-label-${deliveryId}.pdf"`
      );

      stream.pipe(res);
    } catch (error: any) {
      if (
        error.message?.includes('not found') ||
        error.message?.includes('no encontrado')
      ) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  };

  registerFailedAttempt = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const deliveryId = Number(req.params.id);
      const { reason, rescheduledFor } = req.body;

      if (isNaN(deliveryId) || !reason?.trim()) {
        res.status(400).json({
          success: false,
          error: 'ID de delivery inválido o razón faltante',
        });
        return;
      }

      const attempt = await this.registerFailedAttemptUseCase.execute({
        deliveryId,
        reason: reason.trim(),
        rescheduledFor: rescheduledFor ? new Date(rescheduledFor) : undefined,
      });

      res.status(201).json({ success: true, data: attempt });
    } catch (error: any) {
      if (error.message?.includes('no encontrado')) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  };

  confirmDelivery = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const deliveryId = Number(req.params.id);
      if (isNaN(deliveryId)) {
        res
          .status(400)
          .json({ success: false, error: 'ID de delivery inválido' });
        return;
      }

      if (!req.file) {
        res
          .status(400)
          .json({ success: false, error: 'Se requiere una foto de evidencia' });
        return;
      }

      const photoUrl = await this.storageService.uploadImage(
        req.file.buffer,
        req.file.originalname,
        'deliveries'
      );

      const result = await this.confirmDeliveryUseCase.execute({
        deliveryId,
        deliveryPhotoUrl: photoUrl,
      });
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      if (error.message?.includes('no encontrado')) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  };

  updateStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const deliveryId = Number(req.params.id);
      const { status } = req.body;

      if (isNaN(deliveryId) || !status) {
        res.status(400).json({
          success: false,
          error: 'Invalid delivery ID or status missing',
        });
        return;
      }

      const delivery = await this.updateDeliveryStatusUseCase.execute(
        deliveryId,
        status
      );
      res.status(200).json({ success: true, data: delivery });
    } catch (error: any) {
      if (error instanceof InvalidDeliveryStateTransitionError) {
        res.status(409).json({ success: false, error: error.message });
        return;
      }
      if (
        error.message?.includes('not found') ||
        error.message?.includes('no encontrado')
      ) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      res.status(400).json({ success: false, error: error.message });
    }
  };

  returnDelivery = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const deliveryId = Number(req.params.id);

      if (isNaN(deliveryId)) {
        res.status(400).json({ success: false, error: 'Invalid delivery ID' });
        return;
      }

      const delivery = await this.returnDeliveryUseCase.execute(deliveryId);
      res.status(200).json({ success: true, data: delivery });
    } catch (error: any) {
      if (error instanceof InvalidDeliveryStateTransitionError) {
        res.status(409).json({ success: false, error: error.message });
        return;
      }
      if (
        error.message?.includes('not found') ||
        error.message?.includes('no encontrado')
      ) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      res.status(400).json({ success: false, error: error.message });
    }
  };

  confirmDeliveryPin = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const deliveryId = Number(req.params.id);
      const { pin } = req.body;

      if (isNaN(deliveryId)) {
        res
          .status(400)
          .json({ success: false, error: 'ID de delivery inválido' });
        return;
      }

      if (!pin || typeof pin !== 'string' || pin.trim().length !== 6) {
        res.status(400).json({
          success: false,
          error: 'El PIN debe ser un código de 6 dígitos',
        });
        return;
      }

      const result = await this.validateDeliveryPinUseCase.execute({
        deliveryId,
        pin,
      });
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      if (error.message?.includes('no encontrado')) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      if (
        error.message?.includes('PIN incorrecto') ||
        error.message?.includes('no tiene un PIN')
      ) {
        res.status(400).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  };
}
