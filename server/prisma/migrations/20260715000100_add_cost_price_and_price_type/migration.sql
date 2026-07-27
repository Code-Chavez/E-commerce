-- Precio de costo por variante + tipo de precio en historial + costo congelado en venta POS

ALTER TABLE `ProductVariant` ADD COLUMN `costPrice` DECIMAL(10, 2) NOT NULL DEFAULT 0;

ALTER TABLE `PriceHistory` ADD COLUMN `priceType` ENUM('SALE', 'COST') NOT NULL DEFAULT 'SALE';

ALTER TABLE `PosOrderItem` ADD COLUMN `unitCost` DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- Backfill: costPrice de cada variante = unitCost del último asiento de Kardex
UPDATE `ProductVariant` pv
JOIN (
  SELECT ke.variantId, ke.unitCost
  FROM `KardexEntry` ke
  JOIN (
    SELECT variantId, MAX(id) AS maxId
    FROM `KardexEntry`
    GROUP BY variantId
  ) latest ON latest.maxId = ke.id
) k ON k.variantId = pv.id
SET pv.costPrice = k.unitCost;

-- Backfill: unitCost de ventas históricas = costPrice actual de la variante (mejor aproximación disponible)
UPDATE `PosOrderItem` poi
JOIN `ProductVariant` pv ON pv.id = poi.variantId
SET poi.unitCost = pv.costPrice;
