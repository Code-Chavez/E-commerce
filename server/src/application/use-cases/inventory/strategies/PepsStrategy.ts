import type { IKardexCostStrategy, SalidaCostResult } from '@domain/services/IKardexCostStrategy';

interface Lote {
  quantity: number;
  unitCost: number;
}

/**
 * PEPS (FIFO): calcula el costo de una salida consumiendo los lotes de COMPRA
 * más antiguos primero, reproduciendo el historial en memoria.
 *
 * Complejidad: O(n) sobre los asientos del kardex para la variante+sucursal.
 * Limitación conocida: en alta concurrencia, dos transacciones paralelas pueden leer
 * el mismo estado de lotes. Mitigado parcialmente por el nivel de aislamiento
 * REPEATABLE READ de MariaDB dentro de la transacción.
 */
export class PepsStrategy implements IKardexCostStrategy {
  async calcularCostoSalida(params: {
    variantId: number;
    branchId: number;
    quantity: number;
    tx: any;
  }): Promise<SalidaCostResult> {
    const { variantId, branchId, quantity, tx } = params;

    // Bloqueo pesimista: serializa cálculos PEPS concurrentes sobre la misma variante+sucursal
    await tx.$executeRaw`
      SELECT id FROM KardexEntry
      WHERE variantId = ${variantId} AND branchId = ${branchId}
      ORDER BY createdAt DESC LIMIT 1 FOR UPDATE
    `;

    // Leer todos los asientos históricos en orden cronológico
    const entries = await tx.kardexEntry.findMany({
      where: { variantId, branchId },
      orderBy: { createdAt: 'asc' },
      select: { type: true, quantity: true, unitCost: true },
    });

    // Construir queue FIFO de lotes de compra con su remanente
    const queue: Lote[] = [];
    for (const e of entries) {
      if (e.type === 'COMPRA' || e.type === 'DEVOLUCION') {
        queue.push({ quantity: e.quantity, unitCost: e.unitCost });
      } else if (e.type === 'VENTA' || e.type === 'TRANSFERENCIA') {
        // Consumir del frente de la queue
        let remaining = e.quantity;
        while (remaining > 0 && queue.length > 0) {
          const lote = queue[0];
          if (lote.quantity <= remaining) {
            remaining -= lote.quantity;
            queue.shift();
          } else {
            lote.quantity -= remaining;
            remaining = 0;
          }
        }
      }
      // AJUSTE no modifica los lotes PEPS directamente
    }

    // Calcular costo de la nueva salida consumiendo del frente de la queue
    let remaining = quantity;
    let totalCost = 0;
    const queueCopy = queue.map(l => ({ ...l }));

    for (const lote of queueCopy) {
      if (remaining <= 0) break;
      const consumido = Math.min(lote.quantity, remaining);
      totalCost += consumido * lote.unitCost;
      remaining -= consumido;
    }

    if (remaining > 0) {
      throw new Error(
        `Stock PEPS insuficiente para variante ${variantId} en sucursal ${branchId}. ` +
        `Faltan ${remaining} unidades en lotes disponibles.`
      );
    }

    const unitCost = Math.round((totalCost / quantity) * 100) / 100;
    return { unitCost };
  }
}
