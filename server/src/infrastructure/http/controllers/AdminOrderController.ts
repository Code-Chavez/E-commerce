import { Request, Response, NextFunction } from 'express';
import { PrismaOrderRepository } from '@infrastructure/database/repositories/PrismaOrderRepository';
import { ListAdminOrdersUseCase } from '@application/use-cases/admin/ListAdminOrdersUseCase';
import prisma from '@infrastructure/database/prisma';

export class AdminOrderController {
  private listAdminOrdersUseCase: ListAdminOrdersUseCase;

  constructor() {
    const orderRepo = new PrismaOrderRepository();
    this.listAdminOrdersUseCase = new ListAdminOrdersUseCase(orderRepo);
  }

  updateRefundStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orderId = Number(req.params.id);
      const { refundStatus } = req.body;

      if (isNaN(orderId)) {
        res.status(400).json({ success: false, error: 'El ID de pedido proporcionado no es válido' });
        return;
      }

      if (!['PENDING', 'PROCESSED'].includes(refundStatus)) {
        res.status(400).json({ success: false, error: 'refundStatus inválido. Valores permitidos: PENDING, PROCESSED' });
        return;
      }

      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) {
        res.status(404).json({ success: false, error: `Pedido #${orderId} no encontrado` });
        return;
      }

      if (order.refundStatus === 'NONE') {
        res.status(409).json({ success: false, error: 'El pedido no tiene un reembolso solicitado' });
        return;
      }

      const updated = await prisma.$transaction(async (tx) => {
        const o = await tx.order.update({
          where: { id: orderId },
          data: { refundStatus },
        });
        await tx.orderStatusLog.create({
          data: {
            orderId,
            status: o.status,
            changedBy: `ADMIN_REFUND_${refundStatus}`,
          },
        });
        return o;
      });

      res.status(200).json({
        success: true,
        data: { orderId: updated.id, refundStatus: updated.refundStatus },
      });
    } catch (error) {
      next(error);
    }
  };

  listOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, from, to, cursor, limit, userId } = req.query;
      
      const result = await this.listAdminOrdersUseCase.execute({
        status: status as string,
        from: from as string,
        to: to as string,
        cursor: cursor ? Number(cursor) : undefined,
        limit: limit ? Number(limit) : 20,
        userId: userId ? Number(userId) : undefined,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
