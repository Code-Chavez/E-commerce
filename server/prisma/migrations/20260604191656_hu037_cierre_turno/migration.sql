-- AlterTable
ALTER TABLE `CashTurn` ADD COLUMN `closeAmount` DOUBLE NULL;

-- CreateTable
CREATE TABLE `CashMovement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `turnId` INTEGER NOT NULL,
    `type` ENUM('INGRESO', 'EGRESO') NOT NULL,
    `amount` DOUBLE NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CashMovement_turnId_idx`(`turnId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CashMovement` ADD CONSTRAINT `CashMovement_turnId_fkey` FOREIGN KEY (`turnId`) REFERENCES `CashTurn`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
