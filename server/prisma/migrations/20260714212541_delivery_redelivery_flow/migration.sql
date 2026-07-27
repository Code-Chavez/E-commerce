-- DropForeignKey (se recrea al final; IF EXISTS hace la migración segura ante re-ejecución parcial)
ALTER TABLE `Delivery` DROP FOREIGN KEY IF EXISTS `Delivery_orderId_fkey`;

-- DropIndex
ALTER TABLE `Delivery` DROP INDEX IF EXISTS `Delivery_orderId_type_key`;

-- AlterTable
ALTER TABLE `Delivery` ADD COLUMN IF NOT EXISTS `parentDeliveryId` INTEGER NULL,
    MODIFY `status` ENUM('PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'FAILED', 'AWAITING_CLIENT_DECISION', 'RETURNED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `Order` ADD COLUMN IF NOT EXISTS `refundStatus` ENUM('NONE', 'PENDING', 'PROCESSED') NOT NULL DEFAULT 'NONE';

-- CreateIndex
CREATE INDEX IF NOT EXISTS `Delivery_orderId_idx` ON `Delivery`(`orderId`);

-- CreateIndex
CREATE INDEX IF NOT EXISTS `Delivery_parentDeliveryId_idx` ON `Delivery`(`parentDeliveryId`);

-- AddForeignKey
ALTER TABLE `Delivery` ADD CONSTRAINT `Delivery_parentDeliveryId_fkey` FOREIGN KEY IF NOT EXISTS (`parentDeliveryId`) REFERENCES `Delivery`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey (recrea el FK eliminado al inicio junto con el índice único orderId_type)
ALTER TABLE `Delivery` ADD CONSTRAINT `Delivery_orderId_fkey` FOREIGN KEY IF NOT EXISTS (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
