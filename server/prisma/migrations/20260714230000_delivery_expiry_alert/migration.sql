-- Add notes field to KardexEntry for audit trail
ALTER TABLE `KardexEntry` ADD COLUMN IF NOT EXISTS `notes` VARCHAR(500) NULL;

-- Create FailedDeliveryReturnAlert for admin notifications on auto-returns
CREATE TABLE IF NOT EXISTS `FailedDeliveryReturnAlert` (
    `id`             INTEGER NOT NULL AUTO_INCREMENT,
    `orderId`        INTEGER NOT NULL,
    `productCount`   INTEGER NOT NULL,
    `windowHours`    INTEGER NOT NULL,
    `isActive`       BOOLEAN NOT NULL DEFAULT true,
    `autoReturnedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`      DATETIME(3) NOT NULL,
    CONSTRAINT `FailedDeliveryReturnAlert_pkey` PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX IF NOT EXISTS `FailedDeliveryReturnAlert_orderId_key` ON `FailedDeliveryReturnAlert`(`orderId`);

ALTER TABLE `FailedDeliveryReturnAlert`
    ADD CONSTRAINT `FailedDeliveryReturnAlert_orderId_fkey`
    FOREIGN KEY IF NOT EXISTS (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed the configurable decision window (72h default) — upsert safe
INSERT INTO `SystemSetting` (`key`, `value`, `description`, `updatedAt`)
VALUES (
    'FAILED_DELIVERY_DECISION_WINDOW_HOURS',
    '72',
    'Horas que el cliente tiene para decidir reenvío o devolución antes del retorno automático de stock',
    NOW()
)
ON DUPLICATE KEY UPDATE `key` = `key`;
