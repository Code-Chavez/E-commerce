-- AlterTable
ALTER TABLE `StockTransfer` ADD COLUMN `guideNumber` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `StockTransfer_guideNumber_key` ON `StockTransfer`(`guideNumber`);
