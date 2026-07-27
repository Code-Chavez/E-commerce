-- CreateTable
CREATE TABLE `BrandConfig` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `brandName` VARCHAR(191) NOT NULL DEFAULT 'D''Mendoza',
    `logoUrl` VARCHAR(191) NULL,
    `primaryColor` VARCHAR(191) NOT NULL DEFAULT '#4F46E5',
    `socialLinksJson` JSON NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
