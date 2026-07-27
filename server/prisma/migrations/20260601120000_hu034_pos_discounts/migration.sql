-- HU-034: Aplicación de Descuentos en el POS
-- T-124: Agregar campo discountAmount al modelo de ítems de venta
-- Crea los modelos PosOrder y PosOrderItem con soporte de descuentos.

-- CreateEnum
CREATE TABLE `_prisma_new_PosOrderStatus` (
  `value` ENUM('OPEN','COMPLETED','CANCELLED') NOT NULL
);
DROP TABLE `_prisma_new_PosOrderStatus`;

-- AlterTable: Agregar enum directamente en la tabla
-- CreateTable PosOrder
CREATE TABLE `PosOrder` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `status` ENUM('OPEN', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'OPEN',
    `subtotal` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `discountTotal` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `total` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `userId` INTEGER NULL,
    `branchId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PosOrder_branchId_idx`(`branchId`),
    INDEX `PosOrder_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable PosOrderItem (T-124: incluye discountAmount)
CREATE TABLE `PosOrderItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `posOrderId` INTEGER NOT NULL,
    `variantId` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `unitPrice` DECIMAL(10, 2) NOT NULL,
    `discountAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `lineTotal` DECIMAL(10, 2) NOT NULL,

    INDEX `PosOrderItem_posOrderId_idx`(`posOrderId`),
    INDEX `PosOrderItem_variantId_idx`(`variantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey: PosOrder -> Branch
ALTER TABLE `PosOrder` ADD CONSTRAINT `PosOrder_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: PosOrderItem -> PosOrder
ALTER TABLE `PosOrderItem` ADD CONSTRAINT `PosOrderItem_posOrderId_fkey` FOREIGN KEY (`posOrderId`) REFERENCES `PosOrder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: PosOrderItem -> ProductVariant
ALTER TABLE `PosOrderItem` ADD CONSTRAINT `PosOrderItem_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `ProductVariant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
