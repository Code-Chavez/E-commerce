-- CreateTable
CREATE TABLE `Payment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `posOrderId` INTEGER NOT NULL,
    `method` ENUM('CASH', 'CARD', 'TRANSFER', 'YAPE') NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Payment_posOrderId_idx`(`posOrderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_posOrderId_fkey` FOREIGN KEY (`posOrderId`) REFERENCES `PosOrder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
