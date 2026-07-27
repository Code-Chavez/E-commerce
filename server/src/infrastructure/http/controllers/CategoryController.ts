import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaCategoryRepository } from '@infrastructure/database/repositories/PrismaCategoryRepository';
import { CloudinaryStorageService } from '@infrastructure/services/CloudinaryStorageService';

const repo = new PrismaCategoryRepository();
const storageService = new CloudinaryStorageService();

const CreateSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  parentId: z.preprocess(
    (val) => {
      if (val === '' || val === 'null' || val === undefined || val === null) return null;
      const num = Number(val);
      return isNaN(num) ? val : num;
    },
    z.number().int().positive().nullable().optional()
  ),
  sizeGuideUrl: z.string().nullable().optional(),
});

const UpdateSchema = CreateSchema.partial();

export class CategoryController {
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
      if (!data) return res.status(404).json({ success: false, error: 'Categoría no encontrada' });
      return res.status(200).json({ success: true, data });
    } catch (e) { next(e); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = CreateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues });
      
      let imageUrl = undefined;
      if (req.file) {
        imageUrl = await storageService.uploadImage(req.file.buffer, req.file.originalname, 'categories');
      }
      
      const data = await repo.create({ ...parsed.data, imageUrl });
      return res.status(201).json({ success: true, data });
    } catch (e) { next(e); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) return res.status(400).json({ success: false, error: 'ID inválido' });
      
      const existingCategory = await repo.findById(id);
      if (!existingCategory) return res.status(404).json({ success: false, error: 'Categoría no encontrada' });

      const parsed = UpdateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues });
      
      let updateData: any = { ...parsed.data };
      
      if (req.file) {
        const newImageUrl = await storageService.uploadImage(req.file.buffer, req.file.originalname, 'categories');
        updateData.imageUrl = newImageUrl;
        if (existingCategory.imageUrl) {
          await storageService.deleteImage(existingCategory.imageUrl);
        }
      }
      
      const data = await repo.update(id, updateData);
      return res.status(200).json({ success: true, data });
    } catch (e) { next(e); }
  }

  async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) return res.status(400).json({ success: false, error: 'ID inválido' });
      await repo.deactivate(id);
      return res.status(200).json({ success: true, message: 'Categoría inactivada' });
    } catch (e) { next(e); }
  }

  async uploadSizeGuide(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'La imagen de la guía de tallas es requerida' });
      }
      const imageUrl = await storageService.uploadImage(req.file.buffer, req.file.originalname);
      return res.status(201).json({ success: true, data: { url: imageUrl } });
    } catch (error: any) {
      console.error('Error en uploadSizeGuide:', error);
      return res.status(500).json({ success: false, error: 'Error al subir la imagen de la guía de tallas a Cloudinary' });
    }
  }
}
