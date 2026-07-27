import prisma from '@infrastructure/database/prisma';
import { normalizeAttributesJson } from '../utils/AttributeNormalizer';
import {
  IProductRepository,
  IProductVariantRepository,
  CreateVariantDTO,
  UpdateVariantDTO,
  VariantSearchResult,
} from '@domain/repositories/IProductVariantRepository';
import { Product } from '@domain/entities/Product';
import { ProductVariant } from '@domain/entities/ProductVariant';

// ─────────────────────────────────────────────────────────────────────────────
// PrismaProductVariantRepository — HU-014
// ─────────────────────────────────────────────────────────────────────────────
export class PrismaProductVariantRepository implements IProductVariantRepository {
  async findById(id: number): Promise<ProductVariant | null> {
    const record = await prisma.productVariant.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  async findBySku(sku: string): Promise<ProductVariant | null> {
    const record = await prisma.productVariant.findUnique({ where: { sku } });
    return record ? this.toDomain(record) : null;
  }

  async findByProductId(productId: number): Promise<ProductVariant[]> {
    const records = await prisma.productVariant.findMany({
      where: { productId },
      orderBy: { createdAt: 'asc' },
    });
    return records.map((r: any) => this.toDomain(r));
  }

  /**
   * Creación masiva atómica de variantes.
   * Usamos createMany para inserción eficiente, luego findMany para retornar los registros.
   * NOTA: createMany no soporta select/include en MySQL, por eso hacemos findMany posterior.
   */
  async createMany(
    variants: (CreateVariantDTO & { productId: number; sku: string })[]
  ): Promise<ProductVariant[]> {
    await prisma.productVariant.createMany({
      data: variants.map((v) => ({
        productId: v.productId,
        sku: v.sku,
        price: v.price,
        costPrice: v.costPrice ?? 0,
        attributesJson: v.attributesJson,
        isActive: true,
      })),
      // skipDuplicates: false → queremos que falle si hay SKU duplicado (integridad de negocio)
      skipDuplicates: false,
    });

    // Retornar las variantes recién creadas ordenadas por creación
    return this.findByProductId(variants[0].productId).then((all) =>
      all.filter((v) => variants.some((d) => d.sku === v.sku))
    );
  }

  async update(id: number, data: UpdateVariantDTO): Promise<ProductVariant> {
    const record = await prisma.productVariant.update({
      where: { id },
      data: {
        // NOTA: undefined → no actualizar; valor explícito → actualizar (comportamiento Prisma)
        sku: data.sku,
        price: data.price,
        costPrice: data.costPrice,
        isActive: data.isActive,
        minStock: data.minStock,
        discountPercent: data.discountPercent,
      },
    });
    return this.toDomain(record);
  }

  async search(query: string, limit: number): Promise<VariantSearchResult[]> {
    const records = await prisma.productVariant.findMany({
      where: {
        isActive: true,
        OR: [
          { sku: { contains: query } },
          { product: { name: { contains: query } } },
        ],
      },
      include: {
        product: true,
      },
      take: limit,
    });

    return records.map((r: any) => ({
      id: r.id,
      sku: r.sku,
      productName: r.product.name,
      price: Number(r.price),
      costPrice: Number(r.costPrice ?? 0),
    }));
  }

  private toDomain(record: any): ProductVariant {
    return {
      id: record.id,
      productId: record.productId,
      sku: record.sku,
      price: Number(record.price), // Decimal → number
      costPrice: Number(record.costPrice ?? 0),
      attributesJson: normalizeAttributesJson(record.attributesJson),
      isActive: record.isActive,
      minStock: record.minStock,
      discountPercent: record.discountPercent,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
