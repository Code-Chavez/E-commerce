import { Router } from 'express';
import multer from 'multer';
import { CategoryController } from '@infrastructure/http/controllers/CategoryController';
import { ProductBrandController } from '@infrastructure/http/controllers/ProductBrandController';
import { requirePermission } from '@infrastructure/http/middlewares/auth.middleware';

const router = Router();
const categories = new CategoryController();
const brands = new ProductBrandController();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Formato de archivo inválido. Solo se admiten imágenes.'));
    }
  },
});

// ─── Categories ───────────────────────────────────────────────────────────────
router.get('/categories', categories.getAll.bind(categories));
router.get('/categories/:id', categories.getOne.bind(categories));
router.post('/categories', requirePermission('products:write'), upload.single('image'), categories.create.bind(categories));
router.post('/categories/upload', requirePermission('products:write'), upload.single('image'), categories.uploadSizeGuide.bind(categories));
router.patch('/categories/:id', requirePermission('products:write'), upload.single('image'), categories.update.bind(categories));
router.delete('/categories/:id', requirePermission('products:write'), categories.deactivate.bind(categories));

// ─── Brands ───────────────────────────────────────────────────────────────────
router.get('/brands', brands.getAll.bind(brands));
router.get('/brands/:id', brands.getOne.bind(brands));
router.post('/brands', requirePermission('products:write'), brands.create.bind(brands));
router.post('/brands/upload', requirePermission('products:write'), upload.single('image'), brands.uploadLogo.bind(brands));
router.patch('/brands/:id', requirePermission('products:write'), brands.update.bind(brands));
router.delete('/brands/:id', requirePermission('products:write'), brands.deactivate.bind(brands));

export default router;
