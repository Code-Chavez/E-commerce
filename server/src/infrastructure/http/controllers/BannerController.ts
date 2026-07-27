import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaBannerRepository } from '@infrastructure/database/repositories/PrismaBannerRepository';
import { CloudinaryStorageService } from '@infrastructure/services/CloudinaryStorageService';
import {
  GetActiveBannersUseCase,
  GetAllBannersUseCase,
  CreateBannerUseCase,
  UpdateBannerUseCase,
  DeleteBannerUseCase,
  ReorderBannersUseCase,
} from '@application/use-cases/product/BannerUseCases';

const bannerRepository = new PrismaBannerRepository();
const storageService = new CloudinaryStorageService();

const getActiveBannersUseCase = new GetActiveBannersUseCase(bannerRepository);
const getAllBannersUseCase = new GetAllBannersUseCase(bannerRepository);
const createBannerUseCase = new CreateBannerUseCase(bannerRepository);
const updateBannerUseCase = new UpdateBannerUseCase(bannerRepository);
const deleteBannerUseCase = new DeleteBannerUseCase(bannerRepository);
const reorderBannersUseCase = new ReorderBannersUseCase(bannerRepository);

const CreateBannerSchema = z.object({
  linkUrl: z.string().url('Formato de URL inválido').optional().nullable(),
  order: z.preprocess((val) => val === undefined || val === '' ? undefined : Number(val), z.number().int().nonnegative().optional()),
});

const UpdateBannerSchema = z.object({
  linkUrl: z.string().url('Formato de URL inválido').optional().nullable(),
  order: z.preprocess((val) => val === undefined || val === '' ? undefined : Number(val), z.number().int().nonnegative().optional()),
  isActive: z.preprocess((val) => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val;
  }, z.boolean().optional()),
});

const ReorderSchema = z.object({
  orders: z.array(
    z.object({
      id: z.number().int().positive(),
      order: z.number().int().nonnegative(),
    })
  ).min(1, 'Debes proporcionar al menos un orden a actualizar'),
});

export class BannerController {
  /**
   * GET /api/v1/ecommerce/banners
   * Obtener banners activos ordenados por order (Público)
   */
  async getActiveBanners(req: Request, res: Response, next: NextFunction) {
    try {
      const banners = await getActiveBannersUseCase.execute();
      return res.status(200).json({ success: true, data: banners });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/banners
   * Obtener todos los banners del sistema (Admin)
   */
  async getAllBanners(req: Request, res: Response, next: NextFunction) {
    try {
      const banners = await getAllBannersUseCase.execute();
      return res.status(200).json({ success: true, data: banners });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/banners
   * Crear banner con imagen por multer subido a Cloudinary (Admin)
   */
  async createBanner(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'La imagen del banner es requerida' });
      }

      const validation = CreateBannerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          errors: validation.error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      // Subir imagen a Cloudinary usando el storage de perfiles adaptado
      const imageUrl = await storageService.uploadImage(req.file.buffer, req.file.originalname);

      const banner = await createBannerUseCase.execute({
        imageUrl,
        linkUrl: validation.data.linkUrl,
        order: validation.data.order,
      });

      return res.status(201).json({ success: true, data: banner });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/banners/:id
   * Actualizar banner existente (Admin)
   */
  async updateBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'ID de banner inválido' });
      }

      const validation = UpdateBannerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          errors: validation.error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      let imageUrl = undefined;
      if (req.file) {
        imageUrl = await storageService.uploadImage(req.file.buffer, req.file.originalname);
      }

      const updated = await updateBannerUseCase.execute(id, {
        imageUrl,
        linkUrl: validation.data.linkUrl,
        order: validation.data.order,
        isActive: validation.data.isActive,
      });

      return res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      if (error.message.includes('no existe')) {
        return res.status(404).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  /**
   * DELETE /api/v1/banners/:id
   * Eliminar banner (Admin)
   */
  async deleteBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'ID de banner inválido' });
      }

      await deleteBannerUseCase.execute(id);
      return res.status(200).json({ success: true, message: 'Banner eliminado exitosamente' });
    } catch (error: any) {
      if (error.message.includes('no existe')) {
        return res.status(404).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  /**
   * PATCH /api/v1/banners/reorder
   * Reordenar masivamente banners en base a IDs y órdenes (Admin)
   */
  async reorderBanners(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = ReorderSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          errors: validation.error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      await reorderBannersUseCase.execute(validation.data.orders);
      return res.status(200).json({ success: true, message: 'Banners reordenados exitosamente' });
    } catch (error) {
      next(error);
    }
  }
}
