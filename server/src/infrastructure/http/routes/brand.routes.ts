import { Router } from 'express';
import multer from 'multer';
import { BrandController } from '@infrastructure/http/controllers/BrandController';
import { requirePermission } from '@infrastructure/http/middlewares/auth.middleware';

const router = Router();
const brandController = new BrandController();

// Configuración de Multer para logos (limite 2MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Formato de archivo inválido. Solo se admiten imágenes.'));
    }
  },
});

/**
 * GET /api/v1/config/brand
 * Público: Identidad visual para el frontend e-commerce.
 */
router.get(
  '/config/brand',
  brandController.getBrandConfig.bind(brandController)
);

/**
 * PUT /api/v1/config/brand
 * Protegido: Solo administradores pueden modificar el branding.
 */
router.put(
  '/config/brand',
  requirePermission('roles:manage'), 
  brandController.updateBrandConfig.bind(brandController)
);

/**
 * POST /api/v1/config/brand/upload
 * Protegido: Solo administradores pueden subir logos.
 */
router.post(
  '/config/brand/upload',
  requirePermission('roles:manage'),
  upload.single('image'),
  brandController.uploadLogo.bind(brandController)
);

export default router;
