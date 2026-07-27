-- AlterTable
ALTER TABLE `Attribute` ADD COLUMN `isVisualDriver` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `ProductImage` ADD COLUMN `attributeValueId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `ProductImage` ADD CONSTRAINT `ProductImage_attributeValueId_fkey` FOREIGN KEY (`attributeValueId`) REFERENCES `AttributeValue`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
