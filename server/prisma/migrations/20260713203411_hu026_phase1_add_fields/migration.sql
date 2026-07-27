-- AlterTable
ALTER TABLE `KardexEntry` ADD COLUMN `userId` INTEGER NULL,
    MODIFY `type` ENUM('ENTRADA', 'SALIDA', 'AJUSTE', 'COMPRA', 'VENTA', 'TRANSFERENCIA', 'DEVOLUCION') NOT NULL;

-- CreateTable
CREATE TABLE `InventorySettings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `valuationMethod` ENUM('PROMEDIO_PONDERADO', 'PEPS') NOT NULL DEFAULT 'PROMEDIO_PONDERADO',
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedByUserId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `KardexEntry` ADD CONSTRAINT `KardexEntry_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventorySettings` ADD CONSTRAINT `InventorySettings_updatedByUserId_fkey` FOREIGN KEY (`updatedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
