-- ─── HU-051: Gestión de Proveedores y Registro de Ingreso de Mercadería ─────────
-- T-089: Crear modelos Supplier, StockEntry y StockEntryItem en schema.prisma

-- ─── Supplier ───────────────────────────────────────────────────────────────────
CREATE TABLE `Supplier` (
    `id`          INTEGER NOT NULL AUTO_INCREMENT,
    `ruc`         VARCHAR(191) NOT NULL,
    `razonSocial` VARCHAR(191) NOT NULL,
    `contacto`    VARCHAR(191) NOT NULL,
    `direccion`   VARCHAR(191) NULL,
    `isActive`    BOOLEAN NOT NULL DEFAULT true,
    `createdAt`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`   DATETIME(3) NOT NULL,

    UNIQUE INDEX `Supplier_ruc_key`(`ruc`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── StockEntry ─────────────────────────────────────────────────────────────────
CREATE TABLE `StockEntry` (
    `id`            INTEGER NOT NULL AUTO_INCREMENT,
    `supplierId`    INTEGER NOT NULL,
    `invoiceNumber` VARCHAR(191) NOT NULL,
    `branchId`      INTEGER NOT NULL,
    `createdAt`     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`     DATETIME(3) NOT NULL,

    INDEX `StockEntry_supplierId_idx`(`supplierId`),
    INDEX `StockEntry_branchId_idx`(`branchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── StockEntryItem ─────────────────────────────────────────────────────────────
CREATE TABLE `StockEntryItem` (
    `id`           INTEGER NOT NULL AUTO_INCREMENT,
    `stockEntryId` INTEGER NOT NULL,
    `variantId`    INTEGER NOT NULL,
    `quantity`     DOUBLE NOT NULL,
    `unitCost`     DOUBLE NOT NULL,

    INDEX `StockEntryItem_stockEntryId_idx`(`stockEntryId`),
    INDEX `StockEntryItem_variantId_idx`(`variantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── Foreign Keys ───────────────────────────────────────────────────────────────
ALTER TABLE `StockEntry`
    ADD CONSTRAINT `StockEntry_supplierId_fkey`
    FOREIGN KEY (`supplierId`) REFERENCES `Supplier`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `StockEntry`
    ADD CONSTRAINT `StockEntry_branchId_fkey`
    FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `StockEntryItem`
    ADD CONSTRAINT `StockEntryItem_stockEntryId_fkey`
    FOREIGN KEY (`stockEntryId`) REFERENCES `StockEntry`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `StockEntryItem`
    ADD CONSTRAINT `StockEntryItem_variantId_fkey`
    FOREIGN KEY (`variantId`) REFERENCES `ProductVariant`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
