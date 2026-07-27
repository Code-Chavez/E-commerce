-- AlterTable
ALTER TABLE `Payment` ADD COLUMN `creditNoteId` INTEGER NULL,
    MODIFY `method` ENUM('CASH', 'CARD', 'TRANSFER', 'YAPE', 'CREDIT_NOTE') NOT NULL;

-- CreateIndex
CREATE INDEX `Payment_creditNoteId_idx` ON `Payment`(`creditNoteId`);

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_creditNoteId_fkey` FOREIGN KEY (`creditNoteId`) REFERENCES `CreditNote`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
