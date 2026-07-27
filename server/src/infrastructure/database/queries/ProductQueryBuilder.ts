import { Prisma } from '@prisma/client';
import { ProductSearchCriteria } from '@domain/criteria/ProductSearchCriteria';

export class ProductQueryBuilder {
  static build(criteria: ProductSearchCriteria): any {
    const {
      query,
      categoryId,
      brandId,
      genderId,
      minPrice,
      maxPrice,
      branchId,
      cursor,
      limit = 10,
      orderBy = 'relevance',
      attributes,
    } = criteria;

    const whereClause: Prisma.ProductWhereInput = {
      isActive: true,
    };

    // Category Filter
    if (categoryId !== undefined) {
      whereClause.categoryId = categoryId;
    }

    // Brand Filter
    if (brandId !== undefined) {
      whereClause.brandId = brandId;
    }

    // Gender Filter
    if (genderId !== undefined) {
      whereClause.genderId = genderId;
    }

    // Text query search
    if (query) {
      const cleanQuery = query.trim();
      whereClause.OR = [
        { name: { contains: cleanQuery } },
        { description: { contains: cleanQuery } },
        { code: { contains: cleanQuery } },
        { category: { name: { contains: cleanQuery } } },
        { brand: { name: { contains: cleanQuery } } },
        { variants: { some: { sku: { contains: cleanQuery } } } },
      ];
    }

    // Variant-level filters (Price & Stock)
    const variantFilters: Prisma.ProductVariantWhereInput = {
      isActive: true,
    };

    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceFilter: any = {};
      if (minPrice !== undefined) {
        priceFilter.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        priceFilter.lte = maxPrice;
      }
      variantFilters.price = priceFilter;
    }

    if (attributes && Object.keys(attributes).length > 0) {
      const andConditions: Prisma.ProductVariantWhereInput[] = [
        {
          isActive: true,
        },
      ];

      if (variantFilters.price) {
        andConditions.push({ price: variantFilters.price });
      }

      Object.entries(attributes).forEach(([attrId, valueIdStr]) => {
        const valId = Number(valueIdStr);
        if (!isNaN(valId)) {
          andConditions.push({
            attributesJson: {
              path: [attrId, 'valueId'],
              equals: valId,
            } as any,
          });
        }
      });

      whereClause.variants = {
        some: {
          AND: andConditions,
        },
      };
    } else {
      whereClause.variants = {
        some: variantFilters,
      };
    }

    // Include definitions
    const includeClause: Prisma.ProductInclude = {
      images: true,
      category: true,
      brand: true,
      gender: true,
      variants: {
        where: {
          isActive: true,
        },
        include: {
          branchStock: {
            where: {
              status: 'AVAILABLE',
              ...(branchId ? { branchId } : {}),
            },
          },
        },
      },
    };

    // Sorting & Pagination Strategy
    let prismaOrderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] | undefined;
    let takeParam: number | undefined;
    let skipParam: number | undefined;
    let cursorParam: Prisma.ProductWhereUniqueInput | undefined;

    if (orderBy === 'newest') {
      prismaOrderBy = { id: 'desc' };
      takeParam = limit + 1;
      if (cursor) {
        cursorParam = { id: Number(cursor) };
        skipParam = 1;
      } else {
        skipParam = 0;
      }
    } else if (orderBy === 'relevance') {
      prismaOrderBy = { id: 'asc' };
      takeParam = limit + 1;
      if (cursor) {
        cursorParam = { id: Number(cursor) };
        skipParam = 1;
      } else {
        skipParam = 0;
      }
    } else {
      // For price_asc / price_desc, we sort and paginate in memory in the Use Case
      prismaOrderBy = undefined;
      takeParam = undefined;
      skipParam = undefined;
      cursorParam = undefined;
    }

    return {
      where: whereClause,
      include: includeClause,
      ...(prismaOrderBy ? { orderBy: prismaOrderBy } : {}),
      ...(takeParam !== undefined ? { take: takeParam } : {}),
      ...(skipParam !== undefined ? { skip: skipParam } : {}),
      ...(cursorParam ? { cursor: cursorParam } : {}),
    };
  }
}
