-- HU-026 Audit Fix — Fase 2: Eliminar valores deprecados del enum KardexType
-- PRECONDICIÓN: Todos los registros con type='ENTRADA' deben haberse migrado a 'COMPRA'
--               y los de type='SALIDA' a 'VENTA' (script migrate-kardex-types.mjs).
-- AlterTable
ALTER TABLE `KardexEntry`
    MODIFY `type` ENUM('AJUSTE', 'COMPRA', 'VENTA', 'TRANSFERENCIA', 'DEVOLUCION') NOT NULL;
