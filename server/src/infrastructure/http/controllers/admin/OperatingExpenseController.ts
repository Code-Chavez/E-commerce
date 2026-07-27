import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaOperatingExpenseRepository } from '@infrastructure/database/repositories/PrismaOperatingExpenseRepository';
import { CreateOperatingExpenseUseCase } from '@application/use-cases/admin/expenses/CreateOperatingExpenseUseCase';
import { GetOperatingExpensesUseCase } from '@application/use-cases/admin/expenses/GetOperatingExpensesUseCase';
import { UpdateOperatingExpenseUseCase } from '@application/use-cases/admin/expenses/UpdateOperatingExpenseUseCase';
import { DeleteOperatingExpenseUseCase } from '@application/use-cases/admin/expenses/DeleteOperatingExpenseUseCase';

const expenseRepository = new PrismaOperatingExpenseRepository();
const createUseCase = new CreateOperatingExpenseUseCase(expenseRepository);
const getExpensesUseCase = new GetOperatingExpensesUseCase(expenseRepository);
const updateUseCase = new UpdateOperatingExpenseUseCase(expenseRepository);
const deleteUseCase = new DeleteOperatingExpenseUseCase(expenseRepository);

const CreateExpenseSchema = z.object({
  branchId: z.number({ message: 'branchId es obligatorio y debe ser un número' }),
  type: z.enum(['FIXED', 'VARIABLE'], { message: 'type debe ser FIXED o VARIABLE' }),
  description: z.string().min(1, 'description no puede estar vacía'),
  amount: z.number({ message: 'amount es obligatorio y debe ser un número' }).nonnegative('amount no puede ser negativo'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'date debe ser una fecha válida',
  }),
});

const UpdateExpenseSchema = z.object({
  branchId: z.number().optional(),
  type: z.enum(['FIXED', 'VARIABLE']).optional(),
  description: z.string().min(1).optional(),
  amount: z.number().nonnegative().optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'date debe ser una fecha válida',
  }).optional(),
});

const QueryFilterSchema = z.object({
  branchId: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
  from: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  to: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
});

export class OperatingExpenseController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.auth;
      if (!user) {
        return res.status(401).json({ success: false, error: 'No autenticado' });
      }

      const validation = CreateExpenseSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ success: false, error: validation.error.format() });
      }

      const expense = await createUseCase.execute({
        ...validation.data,
        date: new Date(validation.data.date),
        userId: user.userId,
      });

      return res.status(201).json({
        success: true,
        data: expense,
      });
    } catch (error: any) {
      if (error.message.includes('El monto') || error.message.includes('inválid') || error.message.includes('obligatoria')) {
        return res.status(400).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = QueryFilterSchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({ success: false, error: validation.error.format() });
      }

      const expenses = await getExpensesUseCase.execute(validation.data);

      return res.status(200).json({
        success: true,
        data: expenses,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'ID inválido' });
      }

      const validation = UpdateExpenseSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ success: false, error: validation.error.format() });
      }

      const payload = {
        ...validation.data,
        date: validation.data.date ? new Date(validation.data.date) : undefined,
      };

      const expense = await updateUseCase.execute(id, payload);

      return res.status(200).json({
        success: true,
        data: expense,
      });
    } catch (error: any) {
      if (error.message.includes('no encontrado')) {
        return res.status(404).json({ success: false, error: error.message });
      }
      if (error.message.includes('El monto') || error.message.includes('inválid') || error.message.includes('obligatoria')) {
        return res.status(400).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'ID inválido' });
      }

      await deleteUseCase.execute(id);

      return res.status(200).json({
        success: true,
        message: 'Gasto operativo eliminado exitosamente',
      });
    } catch (error: any) {
      if (error.message.includes('no encontrado')) {
        return res.status(404).json({ success: false, error: error.message });
      }
      next(error);
    }
  }
}
