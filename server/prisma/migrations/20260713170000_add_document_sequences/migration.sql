-- AlterTable
ALTER TABLE `PosOrder` ADD COLUMN `correlative` INTEGER NULL,
    ADD COLUMN `documentType` ENUM('BOLETA', 'FACTURA', 'TICKET') NOT NULL DEFAULT 'TICKET',
    ADD COLUMN `series` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `DocumentSequence` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `branchId` INTEGER NOT NULL,
    `documentType` ENUM('BOLETA', 'FACTURA', 'TICKET') NOT NULL,
    `series` VARCHAR(191) NOT NULL,
    `nextNumber` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `DocumentSequence_branchId_documentType_key`(`branchId`, `documentType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `PosOrder_series_correlative_key` ON `PosOrder`(`series`, `correlative`);

-- AddForeignKey
ALTER TABLE `DocumentSequence` ADD CONSTRAINT `DocumentSequence_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
