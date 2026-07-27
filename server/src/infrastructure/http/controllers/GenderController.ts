import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaGenderRepository } from '@infrastructure/database/repositories/PrismaGenderRepository';
import {
  GetAllGendersUseCase,
  GetActiveGendersUseCase,
  CreateGenderUseCase,
  UpdateGenderUseCase,
  DeleteGenderUseCase,
} from '@application/use-cases/product/GenderUseCases';

const repo = new PrismaGenderRepository();
const getAllGendersUseCase = new GetAllGendersUseCase(repo);
const getActiveGendersUseCase = new GetActiveGendersUseCase(repo);
const createGenderUseCase = new CreateGenderUseCase(repo);
const updateGenderUseCase = new UpdateGenderUseCase(repo);
const deleteGenderUseCase = new DeleteGenderUseCase(repo);

const CreateGenderSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
});

const UpdateGenderSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').optional(),
  isActive: z.boolean().optional(),
});

export class GenderController {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await getAllGendersUseCase.execute();
      return res.status(200).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  }

  async getActive(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await getActiveGendersUseCase.execute();
      return res.status(200).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = CreateGenderSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.issues });
      }

      const data = await createGenderUseCase.execute(parsed.data);
      return res.status(201).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'ID inválido' });
      }

      const parsed = UpdateGenderSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.issues });
      }

      const data = await updateGenderUseCase.execute(id, parsed.data);
      return res.status(200).json({ success: true, data });
    } catch (e: any) {
      if (e.message.includes('no existe')) {
        return res.status(404).json({ success: false, error: e.message });
      }
      next(e);
    }
  }

  async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'ID inválido' });
      }

      await deleteGenderUseCase.execute(id);
      return res.status(200).json({ success: true, message: 'Género inactivado exitosamente' });
    } catch (e: any) {
      if (e.message.includes('no existe')) {
        return res.status(404).json({ success: false, error: e.message });
      }
      next(e);
    }
  }
}
