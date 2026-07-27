-- DropForeignKey
ALTER TABLE `StockAlert` DROP FOREIGN KEY `StockAlert_branchId_fkey`;

-- DropForeignKey
ALTER TABLE `StockAlert` DROP FOREIGN KEY `StockAlert_variantId_fkey`;

-- DropIndex
DROP INDEX `StockAlert_branchId_fkey` ON `StockAlert`;

-- AlterTable
ALTER TABLE `BrandConfig` DROP COLUMN `logoUrl`,
    DROP COLUMN `primaryColor`,
    ADD COLUMN `colorBrandAccent` VARCHAR(191) NOT NULL DEFAULT '#3F3F3F',
    ADD COLUMN `colorBrandBg` VARCHAR(191) NOT NULL DEFAULT '#F7F7F5',
    ADD COLUMN `colorBrandPrimary` VARCHAR(191) NOT NULL DEFAULT '#D9D9D2',
    ADD COLUMN `colorBrandText` VARCHAR(191) NOT NULL DEFAULT '#6B6B6B',
    ADD COLUMN `faviconUrl` VARCHAR(191) NULL,
    ADD COLUMN `logoHorizontalUrl` VARCHAR(191) NULL,
    ADD COLUMN `logoVerticalUrl` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `StockAlert` ADD CONSTRAINT `StockAlert_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `ProductVariant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockAlert` ADD CONSTRAINT `StockAlert_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
