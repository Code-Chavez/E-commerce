// Entidad de dominio: ProductVariant
// HU-014 — T-076
// attributesJson contiene los atributos de la variante, ej: { "talla": "M", "color": "NEGRO" }
export interface ProductVariant {
  id: number;
  productId: number;
  sku: string; // SKU único auto-generado: CODIGO-TALLA-COLOR
  price: number; // Precio de venta de la variante (Decimal en BD → number en dominio)
  costPrice: number; // Precio de costo (última compra registrada)
  attributesJson: Record<string, string>; // Atributos clave-valor de la variante
  isActive: boolean;
  minStock: number;
  discountPercent?: number; // Descuento porcentual aplicable a la variante (0-99)
  createdAt: Date;
  updatedAt: Date;
}
