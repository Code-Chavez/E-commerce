import prisma from '@infrastructure/database/prisma';

export interface ValuationItem {
  variantId: number;
  sku: string;
  productName: string;
  categoryName: string;
  branchId: number;
  branchName: string;
  quantity: number;
  unitCost: number;
  salePrice: number;
  valorTotal: number;
}

export interface BranchValuation {
  branchId: number;
  branchName: string;
  variantes: number;
  valor: number;
}

export interface CategoryValuation {
  categoryName: string;
  variantes: number;
  valor: number;
}

export interface InventoryValuationReport {
  totalValor: number;
  totalVariantes: number;
  byBranch: BranchValuation[];
  byCategory: CategoryValuation[];
  items: ValuationItem[];
}

export class GetInventoryValuationUseCase {
  async execute(branchId?: number): Promise<InventoryValuationReport> {
    const where: any = {
      status: 'AVAILABLE',
      quantity: { gt: 0 },
    };
    if (branchId) where.branchId = branchId;

    const stocks = await prisma.branchStock.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true } },
        variant: {
          select: {
            id: true,
            sku: true,
            price: true,
            product: {
              select: {
                name: true,
                category: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (stocks.length === 0) {
      return { totalValor: 0, totalVariantes: 0, byBranch: [], byCategory: [], items: [] };
    }

    // Get last KardexEntry unitCost per variantId+branchId
    const variantBranchPairs = stocks.map(s => ({ variantId: s.variantId, branchId: s.branchId }));

    // Query last kardex entry for each variant+branch combination
    const lastKardexEntries = await Promise.all(
      variantBranchPairs.map(pair =>
        prisma.kardexEntry.findFirst({
          where: { variantId: pair.variantId, branchId: pair.branchId },
          orderBy: { createdAt: 'desc' },
          select: { variantId: true, branchId: true, unitCost: true },
        })
      )
    );

    // Build cost lookup map: `${variantId}-${branchId}` -> unitCost
    const costMap = new Map<string, number>();
    for (const entry of lastKardexEntries) {
      if (entry) {
        costMap.set(`${entry.variantId}-${entry.branchId}`, entry.unitCost);
      }
    }

    const items: ValuationItem[] = [];

    for (const stock of stocks) {
      const unitCost = costMap.get(`${stock.variantId}-${stock.branchId}`) ?? 0;
      if (unitCost === 0) continue; // skip if no kardex entry found

      items.push({
        variantId: stock.variantId,
        sku: stock.variant.sku,
        productName: stock.variant.product.name,
        categoryName: stock.variant.product.category?.name ?? 'Sin categoría',
        branchId: stock.branchId,
        branchName: stock.branch.name,
        quantity: stock.quantity,
        unitCost: Number(unitCost.toFixed(2)),
        salePrice: Number(stock.variant.price),
        valorTotal: Number((stock.quantity * unitCost).toFixed(2)),
      });
    }

    // Group by branch
    const branchMap = new Map<number, { name: string; variantes: number; valor: number }>();
    for (const item of items) {
      const entry = branchMap.get(item.branchId) ?? { name: item.branchName, variantes: 0, valor: 0 };
      entry.variantes += 1;
      entry.valor += item.valorTotal;
      branchMap.set(item.branchId, entry);
    }

    const byBranch: BranchValuation[] = Array.from(branchMap.entries())
      .map(([id, s]) => ({
        branchId: id,
        branchName: s.name,
        variantes: s.variantes,
        valor: Number(s.valor.toFixed(2)),
      }))
      .sort((a, b) => b.valor - a.valor);

    // Group by category
    const categoryMap = new Map<string, { variantes: number; valor: number }>();
    for (const item of items) {
      const entry = categoryMap.get(item.categoryName) ?? { variantes: 0, valor: 0 };
      entry.variantes += 1;
      entry.valor += item.valorTotal;
      categoryMap.set(item.categoryName, entry);
    }

    const byCategory: CategoryValuation[] = Array.from(categoryMap.entries())
      .map(([name, s]) => ({
        categoryName: name,
        variantes: s.variantes,
        valor: Number(s.valor.toFixed(2)),
      }))
      .sort((a, b) => b.valor - a.valor);

    const totalValor = Number(items.reduce((sum, i) => sum + i.valorTotal, 0).toFixed(2));

    return {
      totalValor,
      totalVariantes: items.length,
      byBranch,
      byCategory,
      items,
    };
  }
}
