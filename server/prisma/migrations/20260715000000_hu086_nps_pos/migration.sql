-- AlterTable
ALTER TABLE `PosOrder` ADD COLUMN `clientId` INTEGER NULL;

-- AlterTable
ALTER TABLE `NPSSurvey` 
    ADD COLUMN `channel` ENUM('ECOMMERCE', 'POS') NOT NULL DEFAULT 'ECOMMERCE',
    ADD COLUMN `clientId` INTEGER NULL,
    ADD COLUMN `posOrderId` INTEGER NULL,
    MODIFY `orderId` INTEGER NULL,
    MODIFY `userId` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `NPSSurvey_posOrderId_key` ON `NPSSurvey`(`posOrderId`);

-- CreateIndex
CREATE INDEX `NPSSurvey_clientId_idx` ON `NPSSurvey`(`clientId`);

-- CreateIndex
CREATE INDEX `PosOrder_clientId_idx` ON `PosOrder`(`clientId`);

-- AddForeignKey
ALTER TABLE `PosOrder` ADD CONSTRAINT `PosOrder_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NPSSurvey` ADD CONSTRAINT `NPSSurvey_posOrderId_fkey` FOREIGN KEY (`posOrderId`) REFERENCES `PosOrder`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NPSSurvey` ADD CONSTRAINT `NPSSurvey_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
