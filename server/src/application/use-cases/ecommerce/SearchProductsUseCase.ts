import prisma from '@infrastructure/database/prisma';
import { ProductSearchCriteria } from '@domain/criteria/ProductSearchCriteria';
import { ProductQueryBuilder } from '@infrastructure/database/queries/ProductQueryBuilder';
import { normalizeAttributesJson } from '@infrastructure/database/utils/AttributeNormalizer';

export interface SearchProductsResponse {
  products: any[];
  nextCursor: string | null;
}

export class SearchProductsUseCase {
  async execute(criteria: ProductSearchCriteria): Promise<SearchProductsResponse> {
    const limit = criteria.limit || 10;
    const orderBy = criteria.orderBy || 'relevance';

    // 1. Build Prisma query using the Query Builder
    const queryArgs = ProductQueryBuilder.build(criteria);

    // 2. Execute query
    const rawProducts = await prisma.product.findMany(queryArgs);

    // 3. Map products to include variant stock flags (outOfStock) and calculate prices for sorting
    const mappedProducts = rawProducts.map((product: any) => {
      const mappedVariants = (product.variants || []).map((variant: any) => {
        // Calculate stock for this variant based on retrieved branchStock
        const branchStocks = variant.branchStock || [];
        const stockQuantity = branchStocks.reduce((sum: number, bs: any) => sum + bs.quantity, 0);
        
        return {
          id: variant.id,
          productId: variant.productId,
          sku: variant.sku,
          price: Number(variant.price),
          discountPercent: variant.discountPercent,
          attributesJson: normalizeAttributesJson(variant.attributesJson),
          isActive: variant.isActive,
          minStock: variant.minStock,
          createdAt: variant.createdAt,
          updatedAt: variant.updatedAt,
          stock: stockQuantity,
          outOfStock: stockQuantity <= 0,
        };
      });

      // Find min and max price among active variants
      const activePrices = mappedVariants.map((v: any) => v.price);
      const minVariantPrice = activePrices.length > 0 ? Math.min(...activePrices) : 0;
      const maxVariantPrice = activePrices.length > 0 ? Math.max(...activePrices) : 0;

      return {
        id: product.id,
        code: product.code,
        name: product.name,
        slug: product.slug,
        description: product.description,
        categoryId: product.categoryId,
        brandId: product.brandId,
        gender: product.gender,
        model: product.model,
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        category: product.category,
        brand: product.brand,
        images: product.images,
        variants: mappedVariants,
        _minPrice: minVariantPrice,
        _maxPrice: maxVariantPrice,
      };
    });

    // 4. Sort and Paginate
    let productsToReturn = [];
    let hasMore = false;
    let nextCursor: string | null = null;

    if (orderBy === 'price_asc' || orderBy === 'price_desc') {
      // Sort in memory
      mappedProducts.sort((a, b) => {
        if (orderBy === 'price_asc') {
          return a._minPrice - b._minPrice || a.id - b.id;
        } else {
          return b._maxPrice - a._maxPrice || b.id - a.id;
        }
      });

      // Paginate in memory using offset (cursor is the offset)
      const offset = criteria.cursor ? Number(criteria.cursor) : 0;
      productsToReturn = mappedProducts.slice(offset, offset + limit);
      
      if (mappedProducts.length > offset + limit) {
        hasMore = true;
        nextCursor = String(offset + limit);
      }
    } else {
      // Already sorted and limited by Prisma
      productsToReturn = [...mappedProducts];
      if (productsToReturn.length > limit) {
        hasMore = true;
        productsToReturn.pop(); // Remove the extra item
      }
      if (hasMore && productsToReturn.length > 0) {
        const lastProduct = productsToReturn[productsToReturn.length - 1];
        nextCursor = String(lastProduct.id);
      }
    }

    // Remove temporary sorting fields before returning
    const finalProducts = productsToReturn.map((p) => {
      const { _minPrice, _maxPrice, ...rest } = p;
      return rest;
    });

    return {
      products: finalProducts,
      nextCursor,
    };
  }
}
