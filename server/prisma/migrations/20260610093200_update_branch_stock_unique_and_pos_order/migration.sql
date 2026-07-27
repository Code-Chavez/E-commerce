-- AlterTable: Agregar columna status a BranchStock con enum StockStatus
ALTER TABLE `BranchStock` ADD COLUMN `status` ENUM('AVAILABLE', 'RESERVED', 'SOLD') NOT NULL DEFAULT 'AVAILABLE';

-- DropForeignKey
ALTER TABLE `BranchStock` DROP FOREIGN KEY `BranchStock_variantId_fkey`;

-- DropIndex: Eliminar el índice único anterior (variantId, branchId)
DROP INDEX `BranchStock_variantId_branchId_key` ON `BranchStock`;

-- CreateIndex: Crear el nuevo índice único (variantId, branchId, status)
CREATE UNIQUE INDEX `BranchStock_variantId_branchId_status_key` ON `BranchStock`(`variantId`, `branchId`, `status`);

-- AddForeignKey: Re-add the foreign key for variantId
ALTER TABLE `BranchStock` ADD CONSTRAINT `BranchStock_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `ProductVariant`(`id`) ON UPDATE CASCADE;

-- AlterTable: Agregar columnas cross-branch a PosOrder
ALTER TABLE `PosOrder`
    ADD COLUMN `isCrossBranch` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `sourceBranchId` INTEGER NULL;

-- CreateIndex: Índice para sourceBranchId en PosOrder
CREATE INDEX `PosOrder_sourceBranchId_idx` ON `PosOrder`(`sourceBranchId`);

-- AddForeignKey: PosOrder -> Branch (sourceBranch)
ALTER TABLE `PosOrder` ADD CONSTRAINT `PosOrder_sourceBranchId_fkey` FOREIGN KEY (`sourceBranchId`) REFERENCES `Branch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
