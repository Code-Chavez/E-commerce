import prisma from '@infrastructure/database/prisma';
import { normalizeAttributesJson } from '@infrastructure/database/utils/AttributeNormalizer';

export class GetOnSaleProductsUseCase {
  async execute() {
    // 1. Buscar productos que tengan variantes activas en oferta (discountPercent > 0)
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        variants: {
          some: {
            isActive: true,
            discountPercent: { gt: 0 },
          },
        },
      },
      include: {
        images: true,
        category: true,
        brand: true,
        gender: true,
        variants: {
          where: {
            isActive: true,
            discountPercent: { gt: 0 },
          },
          include: {
            branchStock: true,
          },
        },
      },
    });

    // 2. Mapear y calcular los rangos de precio y descuento para cada producto
    return products.map((product) => {
      const activeSaleVariants = product.variants.map((v: any) => ({
        ...v,
        attributesJson: normalizeAttributesJson(v.attributesJson),
      }));

      const discounts = activeSaleVariants.map((v) => v.discountPercent);
      const minDiscount = discounts.length > 0 ? Math.min(...discounts) : 0;
      const maxDiscount = discounts.length > 0 ? Math.max(...discounts) : 0;

      const finalPrices = activeSaleVariants.map((v) => {
        const price = Number(v.price);
        const discountAmount = (price * v.discountPercent) / 100;
        return price - discountAmount;
      });

      const minPrice = finalPrices.length > 0 ? Math.min(...finalPrices) : 0;
      const maxPrice = finalPrices.length > 0 ? Math.max(...finalPrices) : 0;

      // Calcular stock total para determinar si está agotado
      const totalStock = activeSaleVariants.reduce((sum: number, v: any) => {
        const stockQty = v.branchStock.reduce((s: number, bs: any) => s + bs.quantity, 0);
        return sum + stockQty;
      }, 0);

      // Devolver los datos básicos del producto más los campos calculados
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
        minDiscount,
        maxDiscount,
        minPrice,
        maxPrice,
        outOfStock: totalStock <= 0,
        variants: activeSaleVariants,
      };
    });
  }
}
