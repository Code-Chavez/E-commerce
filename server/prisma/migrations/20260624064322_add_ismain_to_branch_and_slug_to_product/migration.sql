/*
  Warnings:

  - Added the required column `slug` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Branch` ADD COLUMN `isMain` BOOLEAN NOT NULL DEFAULT false;

-- Set the oldest branch as main by default
UPDATE `Branch` SET `isMain` = true ORDER BY `id` LIMIT 1;

-- AlterTable (Add slug as nullable first)
ALTER TABLE `Product` ADD COLUMN `slug` VARCHAR(191) NULL;

-- Populate existing slugs using lowercased name and id
UPDATE `Product` SET `slug` = CONCAT(LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(name, ' ', '-'), 'á', 'a'), 'é', 'e'), 'í', 'i'), 'ó', 'o'), 'ú', 'u')), '-', id);

-- Make slug column NOT NULL
ALTER TABLE `Product` MODIFY COLUMN `slug` VARCHAR(191) NOT NULL;

-- Create Unique Index
CREATE UNIQUE INDEX `Product_slug_key` ON `Product`(`slug`);
