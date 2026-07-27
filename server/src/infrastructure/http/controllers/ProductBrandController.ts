import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaBrandRepository } from '@infrastructure/database/repositories/PrismaBrandRepository';
import { CloudinaryStorageService } from '@infrastructure/services/CloudinaryStorageService';

const repo = new PrismaBrandRepository();
const storageService = new CloudinaryStorageService();

const CreateSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  logoUrl: z.string().url().nullable().optional(),
});

const UpdateSchema = CreateSchema.extend({ isActive: z.boolean().optional() }).partial();

export class ProductBrandController {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await repo.findAll();
      return res.status(200).json({ success: true, data });
    } catch (e) { next(e); }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) return res.status(400).json({ success: false, error: 'ID inválido' });
      const data = await repo.findById(id);
      if (!data) return res.status(404).json({ success: false, error: 'Marca no encontrada' });
      return res.status(200).json({ success: true, data });
    } catch (e) { next(e); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = CreateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues });
      const data = await repo.create(parsed.data);
      return res.status(201).json({ success: true, data });
    } catch (e) { next(e); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) return res.status(400).json({ success: false, error: 'ID inválido' });
      const parsed = UpdateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues });
      const data = await repo.update(id, parsed.data);
      return res.status(200).json({ success: true, data });
    } catch (e) { next(e); }
  }

  async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) return res.status(400).json({ success: false, error: 'ID inválido' });
      await repo.deactivate(id);
      return res.status(200).json({ success: true, message: 'Marca inactivada' });
    } catch (e) { next(e); }
  }

  async uploadLogo(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'La imagen del logo es requerida' });
      }
      const imageUrl = await storageService.uploadImage(req.file.buffer, req.file.originalname, 'brands');
      return res.status(201).json({ success: true, data: { url: imageUrl } });
    } catch (error: any) {
      console.error('Error en uploadLogo:', error);
      return res.status(500).json({ success: false, error: 'Error al subir el logo a Cloudinary' });
    }
  }
}
