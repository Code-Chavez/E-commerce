import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { SearchProductsUseCase } from '@application/use-cases/ecommerce/SearchProductsUseCase';
import { GetProductDetailUseCase } from '@application/use-cases/ecommerce/GetProductDetailUseCase';
import { ProductSearchCriteria } from '@domain/criteria/ProductSearchCriteria';

const searchUseCase = new SearchProductsUseCase();
const getProductDetailUseCase = new GetProductDetailUseCase();

const SearchQuerySchema = z.object({
  q: z.string().optional(),
  categoryId: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().int().positive().optional()
  ),
  brandId: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().int().positive().optional()
  ),
  genderId: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().int().positive().optional()
  ),
  minPrice: z.preprocess((val) => {
    const n = val ? Number(val) : undefined;
    return n !== undefined && n < 0 ? 0 : n;
  }, z.number().nonnegative().optional()),
  maxPrice: z.preprocess((val) => {
    const n = val ? Number(val) : undefined;
    return n !== undefined && n < 0 ? 0 : n;
  }, z.number().nonnegative().optional()),
  branchId: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().int().positive().optional()
  ),
  cursor: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().int().nonnegative().optional()
  ),
  limit: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().int().positive().default(10)
  ),
  orderBy: z
    .enum(['price_asc', 'price_desc', 'newest', 'relevance'])
    .default('relevance'),
});

export class ProductSearchController {
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = SearchQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          errors: parsed.error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      const {
        q,
        categoryId,
        brandId,
        genderId,
        minPrice,
        maxPrice,
        branchId,
        cursor,
        limit,
        orderBy,
      } = parsed.data;

      // Extract dynamic attribute filters (e.g. attr_1=5)
      const attributes: Record<string, string> = {};
      Object.keys(req.query).forEach((key) => {
        if (key.startsWith('attr_')) {
          const attrId = key.substring(5);
          const val = req.query[key];
          if (attrId && typeof val === 'string') {
            attributes[attrId] = val;
          }
        }
      });

      const criteria: ProductSearchCriteria = {
        query: q,
        categoryId,
        brandId,
        genderId,
        minPrice,
        maxPrice,
        branchId,
        cursor,
        limit,
        orderBy,
        attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
      };

      const result = await searchUseCase.execute(criteria);

      return res.status(200).json({
        success: true,
        data: result.products,
        pagination: {
          nextCursor: result.nextCursor,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const slug = req.params.slug as string;
      if (!slug) {
        return res
          .status(400)
          .json({ success: false, error: 'Slug de producto inválido' });
      }

      const product = await getProductDetailUseCase.execute(slug);

      if (!product) {
        return res
          .status(404)
          .json({ success: false, error: 'Producto no encontrado' });
      }

      return res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }
}
