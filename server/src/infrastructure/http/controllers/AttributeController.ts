import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaAttributeRepository } from '@infrastructure/database/repositories/PrismaAttributeRepository';

const repo = new PrismaAttributeRepository();

const NameSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  isVisualDriver: z.boolean().optional(),
});
const ValueSchema = z.object({ value: z.string().min(1, 'El valor es obligatorio') });

export class AttributeController {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      return res.status(200).json({ success: true, data: await repo.findAll() });
    } catch (e) { next(e); }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) return res.status(400).json({ success: false, error: 'ID inválido' });
      const data = await repo.findById(id);
      if (!data) return res.status(404).json({ success: false, error: 'Atributo no encontrado' });
      return res.status(200).json({ success: true, data });
    } catch (e) { next(e); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = NameSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues });
      return res.status(201).json({ success: true, data: await repo.create(parsed.data.name, parsed.data.isVisualDriver) });
    } catch (e) { next(e); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) return res.status(400).json({ success: false, error: 'ID inválido' });
      const parsed = NameSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues });
      return res.status(200).json({ success: true, data: await repo.update(id, parsed.data.name, parsed.data.isVisualDriver) });
    } catch (e) { next(e); }
  }

  async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) return res.status(400).json({ success: false, error: 'ID inválido' });
      await repo.deactivate(id);
      return res.status(200).json({ success: true, message: 'Atributo inactivado' });
    } catch (e) { next(e); }
  }

  async addValue(req: Request, res: Response, next: NextFunction) {
    try {
      const attributeId = parseInt(String(req.params.id), 10);
      if (isNaN(attributeId)) return res.status(400).json({ success: false, error: 'ID inválido' });
      const parsed = ValueSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues });
      return res.status(201).json({ success: true, data: await repo.addValue(attributeId, parsed.data.value) });
    } catch (e) { next(e); }
  }

  async deactivateValue(req: Request, res: Response, next: NextFunction) {
    try {
      const valueId = parseInt(String(req.params.valueId), 10);
      if (isNaN(valueId)) return res.status(400).json({ success: false, error: 'ID inválido' });
      await repo.deactivateValue(valueId);
      return res.status(200).json({ success: true, message: 'Valor inactivado' });
    } catch (e) { next(e); }
  }
}
