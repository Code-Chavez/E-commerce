import { Router } from 'express';
import { ProductVariantController } from '@infrastructure/http/controllers/ProductVariantController';
import {
  ProductController,
  productUpload,
} from '@infrastructure/http/controllers/ProductController';
import { requirePermission } from '@infrastructure/http/middlewares/auth.middleware';

const router = Router();
const productVariantController = new ProductVariantController();
const productController = new ProductController();

// ─────────────────────────────────────────────────────────────────────────────
// Rutas de Productos y Variantes — HU-014 / HU-015
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/ecommerce/products — Listar productos activos (Público de e-commerce)
router.get(
  '/ecommerce/products',
  productController.getActiveProducts.bind(productController)
);

// GET /api/v1/products — Listar todos los productos
router.get(
  '/products',
  requirePermission('products:read'),
  productController.getAll.bind(productController)
);

// GET /api/v1/products/:id — Obtener un producto
router.get(
  '/products/:id',
  requirePermission('products:read'),
  productController.getOne.bind(productController)
);

// GET /api/v1/products/:id/price-history — Obtener historial de precios
router.get(
  '/products/:id/price-history',
  requirePermission('products:read'),
  productController.getPriceHistory.bind(productController)
);

// POST /api/v1/products — Crear producto
router.post(
  '/products',
  requirePermission('products:write'),
  productController.create.bind(productController)
);

// PATCH /api/v1/products/:id — Actualizar producto
router.patch(
  '/products/:id',
  requirePermission('products:write'),
  productController.update.bind(productController)
);

// PATCH /api/v1/products/:id/status — Inactivación / activación lógica de un producto (Admin)
router.patch(
  '/products/:id/status',
  requirePermission('products:write'),
  productController.toggleStatus.bind(productController)
);

// POST /api/v1/products/:id/images — Subir imágenes de producto
router.post(
  '/products/:id/images',
  requirePermission('products:write'),
  productUpload.array('images', 10),
  productController.uploadImages.bind(productController)
);

// DELETE /api/v1/products/:id/images/:imageId — Eliminar imagen de producto
router.delete(
  '/products/:id/images/:imageId',
  requirePermission('products:write'),
  productController.deleteImage.bind(productController)
);

// GET /api/v1/products/:id/variants — Listar variantes de un producto
router.get(
  '/products/:id/variants',
  requirePermission('products:read'),
  productVariantController.getVariantsByProduct.bind(productVariantController)
);

// POST /api/v1/products/:id/variants — Generar variantes con SKU auto-generado
router.post(
  '/products/:id/variants',
  requirePermission('products:write'),
  productVariantController.createVariants.bind(productVariantController)
);

// GET /api/v1/variants/search — Buscar variantes de productos por texto libre (autocomplete)
router.get(
  '/variants/search',
  requirePermission('inventory:read'),
  productVariantController.searchVariants.bind(productVariantController)
);

// PUT /api/v1/variants/:id — Editar precio y/o SKU de una variante individual
router.put(
  '/variants/:id',
  requirePermission('products:write'),
  productVariantController.updateVariant.bind(productVariantController)
);

// PATCH /api/v1/variants/:id/min-stock — Editar umbral de stock mínimo (HU-027)
router.patch(
  '/variants/:id/min-stock',
  requirePermission('products:write'),
  productVariantController.updateMinStock.bind(productVariantController)
);

export default router;
