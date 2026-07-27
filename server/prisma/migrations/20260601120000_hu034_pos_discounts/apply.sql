CREATE TABLE IF NOT EXISTS `PosOrder` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `status` ENUM('OPEN', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'OPEN',
    `subtotal` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `discountTotal` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `total` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `userId` INTEGER NULL,
    `branchId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    INDEX `PosOrder_branchId_idx`(`branchId`),
    INDEX `PosOrder_userId_idx`(`userId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `PosOrder_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `PosOrderItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `posOrderId` INTEGER NOT NULL,
    `variantId` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `unitPrice` DECIMAL(10, 2) NOT NULL,
    `discountAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `lineTotal` DECIMAL(10, 2) NOT NULL,
    INDEX `PosOrderItem_posOrderId_idx`(`posOrderId`),
    INDEX `PosOrderItem_variantId_idx`(`variantId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `PosOrderItem_posOrderId_fkey` FOREIGN KEY (`posOrderId`) REFERENCES `PosOrder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `PosOrderItem_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `ProductVariant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT IGNORE INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`)
VALUES (
    UUID(),
    'hu034_pos_discounts_manual',
    NOW(),
    '20260601120000_hu034_pos_discounts',
    NULL,
    NULL,
    NOW(),
    1
);
