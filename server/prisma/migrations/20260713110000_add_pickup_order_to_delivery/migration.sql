-- DropForeignKey
ALTER TABLE `Delivery` DROP FOREIGN KEY `Delivery_orderId_fkey`;

-- DropIndex
DROP INDEX `Delivery_orderId_key` ON `Delivery`;

-- AlterTable
ALTER TABLE `Delivery` ADD COLUMN `returnRequestId` INTEGER NULL,
    ADD COLUMN `type` ENUM('DELIVERY', 'PICKUP') NOT NULL DEFAULT 'DELIVERY';

-- CreateIndex
CREATE UNIQUE INDEX `Delivery_returnRequestId_key` ON `Delivery`(`returnRequestId`);

-- CreateIndex
CREATE UNIQUE INDEX `Delivery_orderId_type_key` ON `Delivery`(`orderId`, `type`);

-- AddForeignKey
ALTER TABLE `Delivery` ADD CONSTRAINT `Delivery_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Delivery` ADD CONSTRAINT `Delivery_returnRequestId_fkey` FOREIGN KEY (`returnRequestId`) REFERENCES `ReturnRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
