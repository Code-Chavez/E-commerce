-- AlterTable
ALTER TABLE `Delivery`
    ADD COLUMN `deliveryPhotoUrl` VARCHAR(191) NULL,
    ADD COLUMN `deliveredAt` DATETIME(3) NULL;
