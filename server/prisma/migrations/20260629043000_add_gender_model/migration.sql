-- CreateTable
CREATE TABLE `Gender` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Gender_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddColumn
ALTER TABLE `Product` ADD COLUMN `genderId` INTEGER NULL;

-- Insert existing genders from Product to Gender table
INSERT INTO `Gender` (`name`, `isActive`, `createdAt`, `updatedAt`)
SELECT DISTINCT `gender`, true, NOW(), NOW() FROM `Product` WHERE `gender` IS NOT NULL AND `gender` != '';

-- Update Product.genderId based on matching name in Gender table
UPDATE `Product` p
JOIN `Gender` g ON p.gender = g.name
SET p.genderId = g.id;

-- Drop old column gender
ALTER TABLE `Product` DROP COLUMN `gender`;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_genderId_fkey` FOREIGN KEY (`genderId`) REFERENCES `Gender`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
