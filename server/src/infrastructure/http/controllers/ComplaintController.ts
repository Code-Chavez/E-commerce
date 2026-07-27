import { Request, Response, NextFunction } from 'express';
import { CreateComplaintUseCase } from '@application/use-cases/complaint/CreateComplaintUseCase';
import { GetUserComplaintsUseCase } from '@application/use-cases/complaint/GetUserComplaintsUseCase';
import { GetComplaintsAdminUseCase } from '@application/use-cases/complaint/GetComplaintsAdminUseCase';
import { UpdateComplaintStatusUseCase } from '@application/use-cases/complaint/UpdateComplaintStatusUseCase';
import { ComplaintCategory, ComplaintStatus } from '@prisma/client';

const createComplaintUseCase = new CreateComplaintUseCase();
const getUserComplaintsUseCase = new GetUserComplaintsUseCase();
const getComplaintsAdminUseCase = new GetComplaintsAdminUseCase();
const updateComplaintStatusUseCase = new UpdateComplaintStatusUseCase();

const VALID_CATEGORIES = Object.values(ComplaintCategory);
const VALID_STATUSES = Object.values(ComplaintStatus);

export class ComplaintController {
  createComplaint = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'No autenticado' });
        return;
      }

      const { orderId, category, description } = req.body;

      if (!category || !description) {
        res.status(400).json({ success: false, error: 'category y description son requeridos' });
        return;
      }

      if (!VALID_CATEGORIES.includes(category)) {
        res.status(400).json({ success: false, error: `Categoría inválida. Valores: ${VALID_CATEGORIES.join(', ')}` });
        return;
      }

      if (typeof description !== 'string' || description.trim().length < 10) {
        res.status(400).json({ success: false, error: 'La descripción debe tener al menos 10 caracteres' });
        return;
      }

      const complaint = await createComplaintUseCase.execute({
        userId,
        orderId: orderId ? parseInt(String(orderId), 10) : undefined,
        category,
        description: description.trim(),
      });

      res.status(201).json({ success: true, data: complaint });
    } catch (error) {
      next(error);
    }
  };

  getUserComplaints = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'No autenticado' });
        return;
      }

      const complaints = await getUserComplaintsUseCase.execute(userId);
      res.status(200).json({ success: true, data: complaints });
    } catch (error) {
      next(error);
    }
  };

  getAdminComplaints = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawStatus = typeof req.query.status === 'string' ? req.query.status : undefined;
      const statusFilter = rawStatus && VALID_STATUSES.includes(rawStatus as ComplaintStatus)
        ? (rawStatus as ComplaintStatus)
        : undefined;

      const complaints = await getComplaintsAdminUseCase.execute(statusFilter);
      res.status(200).json({ success: true, data: complaints });
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id as string, 10);
      const { status } = req.body;

      if (!status || !VALID_STATUSES.includes(status)) {
        res.status(400).json({ success: false, error: `status inválido. Valores: ${VALID_STATUSES.join(', ')}` });
        return;
      }

      const updated = await updateComplaintStatusUseCase.execute(id, status);
      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  };
}
