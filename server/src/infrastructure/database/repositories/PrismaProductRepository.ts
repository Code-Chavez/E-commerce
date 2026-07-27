import prisma from '@infrastructure/database/prisma';
import { Product, CreateProductDTO } from '@domain/entities/Product';
import { IProductRepository } from '@domain/repositories/IProductVariantRepository';
import { normalizeAttributesJson } from '../utils/AttributeNormalizer';

export class PrismaProductRepository implements IProductRepository {
  private mapProduct(product: any): Product {
    if (!product) return product;
    if (product.variants) {
      product.variants = product.variants.map((v: any) => ({
        ...v,
        attributesJson: normalizeAttributesJson(v.attributesJson),
      }));
    }
    return product;
  }
  async findAll(): Promise<Product[]> {
    const products = await prisma.product.findMany({
      include: { images: true, category: true, brand: true, variants: true, gender: true },
      orderBy: { name: 'asc' },
    });
    return products.map(p => this.mapProduct(p)) as unknown as Product[];
  }

  async findAllActive(): Promise<Product[]> {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { images: true, category: true, brand: true, variants: true, gender: true },
      orderBy: { name: 'asc' },
    });
    return products.map(p => this.mapProduct(p)) as unknown as Product[];
  }

  async findById(id: number): Promise<Product | null> {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { images: true, category: true, brand: true, variants: true, gender: true },
    });
    return product ? this.mapProduct(product) as unknown as Product : null;
  }

  async findByCode(code: string): Promise<Product | null> {
    const product = await prisma.product.findUnique({
      where: { code },
      include: { images: true, category: true, brand: true, variants: true, gender: true },
    });
    return product ? this.mapProduct(product) as unknown as Product : null;
  }

  async create(data: CreateProductDTO | { code: string; name: string; description?: string }): Promise<Product> {
    const fullData = data as CreateProductDTO;
    const generatedSlug = fullData.slug || 
      (fullData.name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + '-' + fullData.code.toLowerCase());

    const product = await prisma.product.create({
      data: {
        code: fullData.code,
        name: fullData.name,
        slug: generatedSlug,
        description: fullData.description ?? null,
        model: fullData.model ?? null,
        categoryId: fullData.categoryId ?? null,
        brandId: fullData.brandId ?? null,
        genderId: fullData.genderId ?? null,
      },
      include: { images: true, variants: true, gender: true },
    });
    return this.mapProduct(product) as unknown as Product;
  }

  async update(id: number, data: Partial<CreateProductDTO & { isActive: boolean }>): Promise<Product> {
    const product = await prisma.product.update({
      where: { id },
      data,
      include: { images: true, variants: true, gender: true },
    });
    return this.mapProduct(product) as unknown as Product;
  }

  async updateStatus(id: number, isActive: boolean): Promise<Product> {
    const product = await prisma.product.update({
      where: { id },
      data: { isActive },
      include: { images: true, variants: true, gender: true },
    });
    return this.mapProduct(product) as unknown as Product;
  }

  async addImage(productId: number, url: string, isMain: boolean, attributeValueId?: number | null): Promise<void> {
    if (isMain) {
      await prisma.productImage.updateMany({
        where: { productId, attributeValueId: attributeValueId ?? null },
        data: { isMain: false },
      });
    }
    await prisma.productImage.create({
      data: {
        productId,
        url,
        isMain,
        attributeValueId: attributeValueId ?? null,
      },
    });
  }

  async countImagesByGroup(productId: number, attributeValueId?: number | null): Promise<number> {
    return prisma.productImage.count({
      where: {
        productId,
        attributeValueId: attributeValueId ?? null,
      },
    });
  }

  async countMainImages(productId: number): Promise<number> {
    return prisma.productImage.count({ where: { productId, isMain: true } });
  }

  async deleteImage(productId: number, imageId: number): Promise<void> {
    await prisma.productImage.delete({
      where: {
        id: imageId,
        productId,
      },
    });
  }
}
