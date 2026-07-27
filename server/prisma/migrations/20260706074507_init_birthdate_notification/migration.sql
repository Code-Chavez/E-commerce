-- AlterTable
ALTER TABLE `Coupon` ADD COLUMN `minPurchaseAmount` DECIMAL(10, 2) NULL,
    ADD COLUMN `specificCategoryId` INTEGER NULL,
    ADD COLUMN `specificProductId` INTEGER NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `birthdate` DATETIME(3) NULL;

-- AddForeignKey
ALTER TABLE `Coupon` ADD CONSTRAINT `Coupon_specificProductId_fkey` FOREIGN KEY (`specificProductId`) REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Coupon` ADD CONSTRAINT `Coupon_specificCategoryId_fkey` FOREIGN KEY (`specificCategoryId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
