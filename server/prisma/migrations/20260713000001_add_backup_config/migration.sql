-- CreateTable
CREATE TABLE `BackupConfig` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `retentionDays` INTEGER NOT NULL DEFAULT 7,
    `adminEmail` VARCHAR(191) NOT NULL DEFAULT 'admin@e-commerce.com',
    `cronExpression` VARCHAR(191) NOT NULL DEFAULT '0 0 * * *',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
