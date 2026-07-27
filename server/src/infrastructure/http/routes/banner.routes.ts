import { Router } from 'express';
import multer from 'multer';
import { BannerController } from '@infrastructure/http/controllers/BannerController';
import { requirePermission } from '@infrastructure/http/middlewares/auth.middleware';

const router = Router();
const bannerController = new BannerController();

// Configuración de Multer para recibir imágenes (limite 5MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Formato de archivo inválido. Solo se admiten imágenes.'));
    }
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// RUTAS DE E-COMMERCE (Públicas)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/ecommerce/banners — Obtener banners activos ordenados (Público)
router.get(
  '/ecommerce/banners',
  bannerController.getActiveBanners.bind(bannerController)
);

// ─────────────────────────────────────────────────────────────────────────────
// RUTAS DE ADMINISTRACIÓN (Protegidas)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/banners — Obtener todos los banners
router.get(
  '/banners',
  requirePermission('products:read'),
  bannerController.getAllBanners.bind(bannerController)
);

// POST /api/v1/banners — Crear banner (con subida de imagen)
router.post(
  '/banners',
  requirePermission('products:write'),
  upload.single('image'),
  bannerController.createBanner.bind(bannerController)
);

// PUT /api/v1/banners/:id — Actualizar banner (opcional con nueva imagen)
router.put(
  '/banners/:id',
  requirePermission('products:write'),
  upload.single('image'),
  bannerController.updateBanner.bind(bannerController)
);

// DELETE /api/v1/banners/:id — Eliminar un banner
router.delete(
  '/banners/:id',
  requirePermission('products:write'),
  bannerController.deleteBanner.bind(bannerController)
);

// PATCH /api/v1/banners/reorder — Reordenar banners dinámicamente
router.patch(
  '/banners/reorder',
  requirePermission('products:write'),
  bannerController.reorderBanners.bind(bannerController)
);

export default router;
