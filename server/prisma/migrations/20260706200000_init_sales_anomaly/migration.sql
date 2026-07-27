-- CreateTable
CREATE TABLE `SalesAnomaly` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `branchId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `avgSales` DECIMAL(10, 2) NOT NULL,
    `stdDev` DECIMAL(10, 2) NOT NULL,
    `actualSales` DECIMAL(10, 2) NOT NULL,
    `sigmas` DECIMAL(5, 2) NOT NULL,
    `direction` ENUM('HIGH', 'LOW') NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SalesAnomaly_branchId_productId_date_key`(`branchId`, `productId`, `date`),
    INDEX `SalesAnomaly_isActive_idx`(`isActive`),
    INDEX `SalesAnomaly_branchId_idx`(`branchId`),
    INDEX `SalesAnomaly_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SalesAnomaly` ADD CONSTRAINT `SalesAnomaly_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SalesAnomaly` ADD CONSTRAINT `SalesAnomaly_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
