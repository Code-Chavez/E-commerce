import { Request, Response } from 'express';
import { z } from 'zod';
import { PrismaBrandConfigRepository } from '@infrastructure/database/repositories/PrismaBrandConfigRepository';
import { PrismaAuditLogRepository } from '@infrastructure/database/repositories/PrismaAuditLogRepository';
import { GetBrandConfigUseCase } from '@application/use-cases/brand/GetBrandConfigUseCase';
import { UpdateBrandConfigUseCase } from '@application/use-cases/brand/UpdateBrandConfigUseCase';
import { CloudinaryStorageService } from '@infrastructure/services/CloudinaryStorageService';

const BrandConfigSchema = z.object({
  brandName: z.string(),
  faviconUrl: z.string().optional().nullable(),
  logoHorizontalUrl: z.string().optional().nullable(),
  logoVerticalUrl: z.string().optional().nullable(),
  colorBrandBg: z.string(),
  colorBrandPrimary: z.string(),
  colorBrandText: z.string(),
  colorBrandAccent: z.string(),
  socialLinksJson: z.any().optional().nullable(),
});

const brandConfigRepository = new PrismaBrandConfigRepository();
const auditLogRepository = new PrismaAuditLogRepository();
const getBrandConfigUseCase = new GetBrandConfigUseCase(brandConfigRepository);
const updateBrandConfigUseCase = new UpdateBrandConfigUseCase(brandConfigRepository, auditLogRepository);
const storageService = new CloudinaryStorageService();

export class BrandController {
  async getBrandConfig(_req: Request, res: Response) {
    try {
      const config = await getBrandConfigUseCase.execute();
      return res.status(200).json({ success: true, data: config });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  async updateBrandConfig(req: Request, res: Response) {
    try {
      const validation = BrandConfigSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ success: false, error: validation.error.issues });
      }
      const adminUserId = req.auth?.userId ?? null;
      const config = await updateBrandConfigUseCase.execute(validation.data, adminUserId);
      return res.status(200).json({ success: true, data: config });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  /**
   * @swagger
   * /api/v1/config/brand/upload:
   *   post:
   *     tags:
   *       - Brand
   *     summary: Sube una imagen (logo o favicon) para el Branding
   *     description: Sube una imagen a Cloudinary y devuelve la URL para ser asignada al BrandConfig. Requiere permisos de administrador.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               image:
   *                 type: string
   *                 format: binary
   *                 description: El archivo de imagen (PNG, JPG, WEBP, etc.)
   *     responses:
   *       201:
   *         description: Imagen subida correctamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     url:
   *                       type: string
   *                       example: "https://res.cloudinary.com/..."
   *       400:
   *         description: No se proporcionó la imagen
   *       500:
   *         description: Error interno del servidor al subir la imagen
   */
  async uploadLogo(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'La imagen del logo es requerida' });
      }

      // Subir imagen a Cloudinary usando el storage configurado
      const imageUrl = await storageService.uploadImage(req.file.buffer, req.file.originalname);
      return res.status(201).json({ success: true, data: { url: imageUrl } });
    } catch (error: any) {
      console.error('Error en uploadLogo:', error);
      return res.status(500).json({ success: false, error: 'Error al subir el logo a Cloudinary' });
    }
  }
}
