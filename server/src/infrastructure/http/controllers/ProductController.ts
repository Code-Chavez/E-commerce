import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaProductRepository } from '@infrastructure/database/repositories/PrismaProductRepository';
import { GetActiveProductsUseCase } from '@application/use-cases/product/GetActiveProductsUseCase';
import { ToggleProductStatusUseCase } from '@application/use-cases/product/ToggleProductStatusUseCase';
import { GetProductPriceHistoryUseCase } from '@application/use-cases/product/GetProductPriceHistoryUseCase';
import { PrismaAuditLogRepository } from '@infrastructure/database/repositories/PrismaAuditLogRepository';
import multer from 'multer';
import { CloudinaryStorageService } from '@infrastructure/services/CloudinaryStorageService';

const repo = new PrismaProductRepository();
const auditRepo = new PrismaAuditLogRepository();
const getActiveProductsUseCase = new GetActiveProductsUseCase(repo);
const toggleProductStatusUseCase = new ToggleProductStatusUseCase(repo);
const getProductPriceHistoryUseCase = new GetProductPriceHistoryUseCase();

const ToggleStatusSchema = z.object({
  isActive: z.boolean(),
});

const CreateProductSchema = z.object({
  code: z.string().min(1, 'El código es obligatorio'),
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  categoryId: z.number().int().positive(),
  brandId: z.number().int().positive(),
  genderId: z.number().int().positive().nullable().optional(),
});

export const productUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});

export class ProductController {
  async getActiveProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const products = await getActiveProductsUseCase.execute();
      return res.status(200).json({ success: true, data: products });
    } catch (error) {
      next(error);
    }
  }

  async toggleStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        return res
          .status(400)
          .json({ success: false, error: 'ID de producto inválido' });
      }

      const validation = ToggleStatusSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          errors: validation.error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      const updatedProduct = await toggleProductStatusUseCase.execute(
        id,
        validation.data.isActive
      );
      return res.status(200).json({ success: true, data: updatedProduct });
    } catch (error: any) {
      if (error.message && error.message.includes('no existe')) {
        return res.status(404).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      return res
        .status(200)
        .json({ success: true, data: await repo.findAll() });
    } catch (e) {
      next(e);
    }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id))
        return res.status(400).json({ success: false, error: 'ID inválido' });
      const data = await repo.findById(id);
      if (!data)
        return res
          .status(404)
          .json({ success: false, error: 'Producto no encontrado' });
      return res.status(200).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const body = {
        ...req.body,
        categoryId: Number(req.body.categoryId),
        brandId: Number(req.body.brandId),
        genderId: req.body.genderId ? Number(req.body.genderId) : null,
      };
      const parsed = CreateProductSchema.safeParse(body);
      if (!parsed.success)
        return res
          .status(400)
          .json({ success: false, error: parsed.error.issues });
      const data = await repo.create(parsed.data);
      return res.status(201).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id))
        return res.status(400).json({ success: false, error: 'ID inválido' });
      const body = {
        ...req.body,
        categoryId: req.body.categoryId
          ? Number(req.body.categoryId)
          : undefined,
        brandId: req.body.brandId ? Number(req.body.brandId) : undefined,
        genderId:
          req.body.genderId !== undefined
            ? req.body.genderId
              ? Number(req.body.genderId)
              : null
            : undefined,
      };
      const parsed = CreateProductSchema.partial().safeParse(body);
      if (!parsed.success)
        return res
          .status(400)
          .json({ success: false, error: parsed.error.issues });
      const data = await repo.update(id, parsed.data);
      return res.status(200).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  }

  async uploadImages(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = parseInt(String(req.params.id), 10);
      if (isNaN(productId))
        return res.status(400).json({ success: false, error: 'ID inválido' });

      const product = await repo.findById(productId);
      if (!product)
        return res
          .status(404)
          .json({ success: false, error: 'Producto no encontrado' });

      const attributeValueId = req.body.attributeValueId
        ? parseInt(String(req.body.attributeValueId), 10)
        : null;
      if (req.body.attributeValueId && isNaN(attributeValueId!)) {
        return res
          .status(400)
          .json({ success: false, error: 'attributeValueId inválido' });
      }

      const files = req.files as Express.Multer.File[];
      if (!files?.length)
        return res
          .status(400)
          .json({ success: false, error: 'No se enviaron imágenes' });

      // Validar límite de 4 imágenes por agrupación (productId, attributeValueId)
      const existingCount = await repo.countImagesByGroup(
        productId,
        attributeValueId
      );
      if (existingCount + files.length > 4) {
        return res.status(400).json({
          success: false,
          error: `No puedes subir más de 4 imágenes para esta agrupación. Actualmente ya tienes ${existingCount} imagen(es).`,
        });
      }

      const isMainParam = req.body.isMain;
      const mainIndex =
        isMainParam !== undefined ? parseInt(String(isMainParam), 10) : 0;

      const storageService = new CloudinaryStorageService();

      for (let i = 0; i < files.length; i++) {
        const imageUrl = await storageService.uploadImage(
          files[i].buffer,
          files[i].originalname,
          'products'
        );
        const isMain = i === mainIndex;
        await repo.addImage(productId, imageUrl, isMain, attributeValueId);
      }

      const updated = await repo.findById(productId);
      return res.status(201).json({ success: true, data: updated });
    } catch (e) {
      next(e);
    }
  }

  async deleteImage(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = parseInt(String(req.params.id), 10);
      const imageId = parseInt(String(req.params.imageId), 10);
      if (isNaN(productId) || isNaN(imageId)) {
        return res.status(400).json({ success: false, error: 'ID inválido' });
      }
      const product = await repo.findById(productId);
      if (!product) {
        return res
          .status(404)
          .json({ success: false, error: 'Producto no encontrado' });
      }
      await repo.deleteImage(productId, imageId);
      return res
        .status(200)
        .json({ success: true, message: 'Imagen eliminada' });
    } catch (e) {
      next(e);
    }
  }

  async getPriceHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        return res
          .status(400)
          .json({ success: false, error: 'ID de producto inválido' });
      }
      const history = await getProductPriceHistoryUseCase.execute(id);
      return res.status(200).json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  }
}
