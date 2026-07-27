import prisma from '@infrastructure/database/prisma';

export interface RelatedProductItem {
  id: number;
  name: string;
  slug: string;
  images: Array<{ url: string; isMain: boolean }>;
  category: { id: number; name: string } | null;
  brand: { id: number; name: string } | null;
  minPrice: number;
  maxPrice: number;
  minDiscount: number;
  maxDiscount: number;
  variantId: number;
  isOutOfStock: boolean;
}

export class GetRelatedProductsUseCase {
  async execute(productId: number, userId?: number): Promise<RelatedProductItem[]> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, categoryId: true },
    });
    if (!product) return [];

    const productVariants = await prisma.productVariant.findMany({
      where: { productId, isActive: true },
      select: { id: true },
    });
    const variantIds = productVariants.map(v => v.id);

    // Cross-sell: find products bought in same orders (ecommerce + POS)
    const crossSellVariantIds = new Set<number>();

    if (variantIds.length > 0) {
      const orderItems = await prisma.orderItem.findMany({
        where: { variantId: { in: variantIds } },
        select: { orderId: true },
        take: 200,
      });
      const orderIds = [...new Set(orderItems.map(oi => oi.orderId))];
      if (orderIds.length > 0) {
        const coItems = await prisma.orderItem.findMany({
          where: { orderId: { in: orderIds }, variantId: { notIn: variantIds } },
          select: { variantId: true },
        });
        coItems.forEach(ci => crossSellVariantIds.add(ci.variantId));
      }

      const posOrderItems = await prisma.posOrderItem.findMany({
        where: { variantId: { in: variantIds } },
        select: { posOrderId: true },
        take: 200,
      });
      const posOrderIds = [...new Set(posOrderItems.map(pi => pi.posOrderId))];
      if (posOrderIds.length > 0) {
        const posCoItems = await prisma.posOrderItem.findMany({
          where: { posOrderId: { in: posOrderIds }, variantId: { notIn: variantIds } },
          select: { variantId: true },
        });
        posCoItems.forEach(ci => crossSellVariantIds.add(ci.variantId));
      }
    }

    let crossSellProductIds: number[] = [];
    if (crossSellVariantIds.size > 0) {
      const variants = await prisma.productVariant.findMany({
        where: { id: { in: [...crossSellVariantIds] }, isActive: true },
        select: { productId: true },
        distinct: ['productId'],
      });
      crossSellProductIds = variants.map(v => v.productId).filter(id => id !== productId);
    }

    // RFM: if userId provided, derive user's typical price range from order history
    let rfmMinPrice: number | undefined;
    let rfmMaxPrice: number | undefined;
    if (userId) {
      const userOrderItems = await prisma.orderItem.findMany({
        where: { order: { userId } },
        select: { unitPrice: true },
        take: 100,
      });
      if (userOrderItems.length >= 3) {
        const prices = userOrderItems.map(oi => Number(oi.unitPrice));
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
        rfmMinPrice = avg * 0.3;
        rfmMaxPrice = avg * 2.5;
      }
    }

    const mainBranch =
      (await prisma.branch.findFirst({ where: { isMain: true, isActive: true } })) ??
      (await prisma.branch.findFirst({ where: { isActive: true }, orderBy: { id: 'asc' } }));

    const branchStockInclude = mainBranch
      ? { where: { branchId: mainBranch.id, status: 'AVAILABLE' as const } }
      : false;

    const fetchProducts = (ids: number[], limit: number) =>
      prisma.product.findMany({
        where: { id: { in: ids }, isActive: true },
        include: {
          images: true,
          category: { select: { id: true, name: true } },
          brand: { select: { id: true, name: true } },
          variants: {
            where: { isActive: true },
            include: { branchStock: branchStockInclude },
          },
        },
        take: limit,
      });

    let results = await fetchProducts(crossSellProductIds, 8);

    // Fill remaining slots with same-category products
    if (results.length < 8 && product.categoryId) {
      const excludeIds = [productId, ...results.map(p => p.id)];
      const categoryProducts = await prisma.product.findMany({
        where: { categoryId: product.categoryId, isActive: true, id: { notIn: excludeIds } },
        include: {
          images: true,
          category: { select: { id: true, name: true } },
          brand: { select: { id: true, name: true } },
          variants: {
            where: { isActive: true },
            include: { branchStock: branchStockInclude },
          },
        },
        take: 8 - results.length,
        orderBy: { createdAt: 'desc' },
      });
      results = [...results, ...categoryProducts];
    }

    return results
      .map(p => {
        const active = p.variants.filter(v => v.isActive);
        if (active.length === 0) return null;

        const prices = active.map(v => Number(v.price));
        const discounts = active.map(v => (v as any).discountPercent ?? 0);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const minDiscount = Math.min(...discounts);
        const maxDiscount = Math.max(...discounts);

        if (rfmMinPrice !== undefined && rfmMaxPrice !== undefined) {
          if (maxPrice < rfmMinPrice || minPrice > rfmMaxPrice) return null;
        }

        const stockedVariant = active.find(v => {
          const stocks = (v as any).branchStock as any[];
          return stocks.reduce((s: number, bs: any) => s + bs.quantity, 0) > 0;
        });
        const firstVariant = stockedVariant ?? active[0];

        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          images: p.images.map(img => ({ url: img.url, isMain: img.isMain })),
          category: p.category,
          brand: p.brand,
          minPrice,
          maxPrice,
          minDiscount,
          maxDiscount,
          variantId: firstVariant.id,
          isOutOfStock: !stockedVariant,
        } satisfies RelatedProductItem;
      })
      .filter((p): p is RelatedProductItem => p !== null)
      .slice(0, 8);
  }
}
