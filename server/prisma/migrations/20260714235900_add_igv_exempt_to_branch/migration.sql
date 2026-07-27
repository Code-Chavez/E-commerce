-- AlterTable: sucursales en zona exonerada de IGV (Ley 27037 - Promoción de la Inversión en la Amazonía)
ALTER TABLE `Branch` ADD COLUMN `igvExempt` BOOLEAN NOT NULL DEFAULT false;

-- Todas las sucursales actuales están en Chachapoyas, Amazonas → exoneradas
UPDATE `Branch` SET `igvExempt` = true;
