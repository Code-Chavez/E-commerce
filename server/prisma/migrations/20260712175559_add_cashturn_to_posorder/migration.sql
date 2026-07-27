-- AlterTable
ALTER TABLE `PosOrder` ADD COLUMN `cashTurnId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `PosOrder` ADD CONSTRAINT `PosOrder_cashTurnId_fkey` FOREIGN KEY (`cashTurnId`) REFERENCES `CashTurn`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
