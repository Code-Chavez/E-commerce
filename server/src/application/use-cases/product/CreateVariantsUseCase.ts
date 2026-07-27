import {
  IProductRepository,
  IProductVariantRepository,
} from '@domain/repositories/IProductVariantRepository';
import {
  CreateVariantsRequestDTO,
  ProductWithVariantsResponseDTO,
  VariantResponseDTO,
} from '../../dtos/ProductVariantDTOs';
import { ProductVariant } from '@domain/entities/ProductVariant';
import prisma from '@infrastructure/database/prisma';

/**
 * CreateVariantsUseCase — T-077
 *
 * Genera el producto cartesiano de todos los atributos recibidos y
 * crea automáticamente una variante por cada combinación, asignando
 * un SKU único con el patrón: CODIGO-VALOR1-VALOR2 (en mayúsculas).
 *
 * Ejemplo:
 *   attributes: { talla: ["S","M"], color: ["NEGRO","BLANCO"] }
 *   → SKUs: "CAM-S-NEGRO", "CAM-S-BLANCO", "CAM-M-NEGRO", "CAM-M-BLANCO"
 */
export class CreateVariantsUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly variantRepository: IProductVariantRepository
  ) {}

  async execute(
    productId: number,
    dto: CreateVariantsRequestDTO
  ): Promise<ProductWithVariantsResponseDTO> {
    // 1. Verificar que el producto existe
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new Error('El producto no existe');
    }

    // 2. Validar que hay al menos un atributo con al menos un valor
    const attributeKeys = Object.keys(dto.attributes);
    if (attributeKeys.length === 0) {
      throw new Error(
        'Debes proporcionar al menos un atributo para generar variantes'
      );
    }
    for (const key of attributeKeys) {
      if (!dto.attributes[key] || dto.attributes[key].length === 0) {
        throw new Error(`El atributo "${key}" debe tener al menos un valor`);
      }
    }

    // 3. Generar producto cartesiano de atributos
    const combinations = this.cartesianProduct(dto.attributes);

    // Fetch active attributes and their values to resolve IDs
    const attributesFromDb = await prisma.attribute.findMany({
      where: { isActive: true },
      include: { values: { where: { isActive: true } } },
    });

    // 4. Construir datos de variantes con SKU auto-generado
    const variantsData = combinations.map((attrs) => {
      // SKU: CODIGO_PRODUCTO-VALOR_ATTR1-VALOR_ATTR2... (en mayúsculas, sin espacios)
      const attrValues = attributeKeys.map((k) =>
        attrs[k].toUpperCase().replace(/\s+/g, '_')
      );
      const sku = [product.code.toUpperCase(), ...attrValues].join('-');

      // Build enriched attributesJson: {"attributeId": { name, valueId, value }}
      const enrichedAttributesJson: Record<string, any> = {};
      for (const [attrName, attrValStr] of Object.entries(attrs)) {
        const dbAttr = attributesFromDb.find(
          (a) => a.name.toLowerCase() === attrName.toLowerCase()
        );
        if (dbAttr) {
          const dbValue = dbAttr.values.find(
            (v) => v.value.toLowerCase() === attrValStr.toLowerCase()
          );
          if (dbValue) {
            enrichedAttributesJson[String(dbAttr.id)] = {
              name: dbAttr.name,
              valueId: dbValue.id,
              value: dbValue.value,
            };
          } else {
            enrichedAttributesJson[attrName] = attrValStr;
          }
        } else {
          enrichedAttributesJson[attrName] = attrValStr;
        }
      }

      return {
        productId,
        sku,
        price: dto.basePrice,
        costPrice: dto.baseCostPrice ?? 0,
        attributesJson: enrichedAttributesJson as any,
      };
    });

    // 5. Verificar que no haya SKUs duplicados con variantes ya existentes
    const existingVariants =
      await this.variantRepository.findByProductId(productId);
    const existingSkus = new Set(existingVariants.map((v) => v.sku));
    const duplicatedSkus = variantsData.filter((v) => existingSkus.has(v.sku));
    if (duplicatedSkus.length > 0) {
      throw new Error(
        `Los siguientes SKUs ya existen para este producto: ${duplicatedSkus.map((v) => v.sku).join(', ')}`
      );
    }

    // 6. Crear todas las variantes en la BD
    const createdVariants =
      await this.variantRepository.createMany(variantsData);

    // 7. Retornar DTO de producto con variantes
    return this.mapToProductDTO(product, [
      ...existingVariants,
      ...createdVariants,
    ]);
  }

  /**
   * Genera el producto cartesiano de un mapa de atributos.
   * Ej: { talla: ["S","M"], color: ["NEGRO","BLANCO"] }
   *   → [{ talla:"S", color:"NEGRO" }, { talla:"S", color:"BLANCO" },
   *      { talla:"M", color:"NEGRO" }, { talla:"M", color:"BLANCO" }]
   */
  private cartesianProduct(
    attributes: Record<string, string[]>
  ): Record<string, string>[] {
    const keys = Object.keys(attributes);
    const values = keys.map((k) => attributes[k]);

    return values.reduce<Record<string, string>[]>(
      (acc, vals) =>
        acc.flatMap((combo) =>
          vals.map((val) => ({ ...combo, [keys[values.indexOf(vals)]]: val }))
        ),
      [{}]
    );
  }

  private mapVariantToDTO(variant: ProductVariant): VariantResponseDTO {
    return {
      id: variant.id,
      productId: variant.productId,
      sku: variant.sku,
      price: variant.price,
      costPrice: variant.costPrice,
      attributesJson: variant.attributesJson,
      isActive: variant.isActive,
      minStock: variant.minStock,
      createdAt: variant.createdAt,
      updatedAt: variant.updatedAt,
    };
  }

  private mapToProductDTO(
    product: any,
    variants: ProductVariant[]
  ): ProductWithVariantsResponseDTO {
    return {
      id: product.id,
      code: product.code,
      name: product.name,
      description: product.description ?? null,
      isActive: product.isActive,
      variants: variants.map((v) => this.mapVariantToDTO(v)),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
