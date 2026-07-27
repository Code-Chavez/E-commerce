import prisma from '@infrastructure/database/prisma';
import { Gender } from '@domain/entities/Gender';
import { normalizeAttributesJson } from '@infrastructure/database/utils/AttributeNormalizer';

export interface ProductDetailResponse {
  id: number;
  code: string;
  name: string;
  slug: string;
  description: string | null;
  categoryId: number | null;
  brandId: number | null;
  gender: Gender | null;
  model?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  category: any;
  brand: any;
  images: any[];
  variants: any[];
  sizeGuideUrl: string | null;
}

export class GetProductDetailUseCase {
  async execute(slug: string): Promise<ProductDetailResponse | null> {
    // 1. Find the main branch (isMain = true) to get stock levels
    let mainBranch = await prisma.branch.findFirst({
      where: { isMain: true, isActive: true },
    });

    // Fallback: if no branch is marked as main, find the first active branch
    if (!mainBranch) {
      mainBranch = await prisma.branch.findFirst({
        where: { isActive: true },
        orderBy: { id: 'asc' },
      });
    }

    // 2. Fetch the product by slug
    const product = await prisma.product.findFirst({
      where: { slug, isActive: true },
      include: {
        images: true,
        category: true,
        brand: true,
        gender: true,
        variants: {
          where: { isActive: true },
          include: {
            branchStock: mainBranch
              ? {
                  where: {
                    branchId: mainBranch.id,
                    status: 'AVAILABLE',
                  },
                }
              : false,
          },
        },
      },
    });

    if (!product) {
      return null;
    }

    // 3. Map variants to compute stock and outOfStock flag for the main branch
    const mappedVariants = (product.variants || []).map((variant: any) => {
      const branchStocks = variant.branchStock || [];
      const stockQuantity = branchStocks.reduce((sum: number, bs: any) => sum + bs.quantity, 0);

      return {
        id: variant.id,
        productId: variant.productId,
        sku: variant.sku,
        price: Number(variant.price),
        attributesJson: normalizeAttributesJson(variant.attributesJson),
        isActive: variant.isActive,
        minStock: variant.minStock,
        createdAt: variant.createdAt,
        updatedAt: variant.updatedAt,
        stock: stockQuantity,
        outOfStock: stockQuantity <= 0,
        discountPercent: variant.discountPercent || 0,
      };
    });

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
      sizeGuideUrl: product.category?.sizeGuideUrl || null,
    };
  }
}
