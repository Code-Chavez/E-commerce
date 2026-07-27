import { Router } from 'express';
import { ProductSearchController } from '@infrastructure/http/controllers/ecommerce/ProductSearchController';
import { ProductBestSellersController } from '@infrastructure/http/controllers/ecommerce/ProductBestSellersController';
import { ProductOnSaleController } from '@infrastructure/http/controllers/ecommerce/ProductOnSaleController';
import { CategoryController } from '@infrastructure/http/controllers/CategoryController';
import { GenderController } from '@infrastructure/http/controllers/GenderController';
import { EcommerceAttributeController } from '@infrastructure/http/controllers/ecommerce/EcommerceAttributeController';
import { RelatedProductsController } from '@infrastructure/http/controllers/ecommerce/RelatedProductsController';

const router = Router();
const searchController = new ProductSearchController();
const bestSellersController = new ProductBestSellersController();
const onSaleController = new ProductOnSaleController();
const categoryController = new CategoryController();
const genderController = new GenderController();
const attributeController = new EcommerceAttributeController();
const relatedController = new RelatedProductsController();

// Rutas Públicas E-commerce
router.get('/ecommerce/categories', categoryController.getAll.bind(categoryController));
router.get('/ecommerce/genders', genderController.getActive.bind(genderController));
router.get('/ecommerce/attributes', attributeController.getActiveAttributes.bind(attributeController));
router.get('/ecommerce/products/search', searchController.search.bind(searchController));
router.get('/ecommerce/products/best-sellers', bestSellersController.getBestSellers.bind(bestSellersController));
router.get('/ecommerce/products/on-sale', onSaleController.getOnSale.bind(onSaleController));

// GET /api/v1/ecommerce/products/:id/related — HU-093 Cross-selling (antes del :slug para evitar conflictos)
router.get('/ecommerce/products/:id/related', relatedController.getRelated.bind(relatedController));

// GET /api/v1/ecommerce/products/:slug — Detalle de un producto por slug (Público de e-commerce)
router.get('/ecommerce/products/:slug', searchController.getDetail.bind(searchController));

export default router;
