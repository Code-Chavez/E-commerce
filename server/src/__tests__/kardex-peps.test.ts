/**
 * HU-026 Audit Fix — Test Mandatorio Nivel C
 * Caso 3 (Core PEPS): 2 compras a distintos costos + 1 venta →
 * verificar que el costo consume el lote más antiguo primero.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { PepsStrategy } from '@application/use-cases/inventory/strategies/PepsStrategy';
import { KardexService } from '@application/use-cases/inventory/KardexService';

// ─── Mock Prisma ─────────────────────────────────────────────────────────────

jest.mock('@infrastructure/database/prisma', () => {
  const mockPrisma: any = {
    kardexEntry: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    branchStock: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    inventorySettings: {
      upsert: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation(async (cb: any) => cb(mockPrisma)),
    $executeRaw: jest.fn(),
  };
  return { __esModule: true, default: mockPrisma };
});

jest.mock('@infrastructure/context/RequestContext', () => ({
  requestContext: {
    getStore: jest.fn().mockReturnValue({ userId: 5 }),
    run: jest.fn((_store: any, cb: any) => cb()),
  },
  requestContextMiddleware: jest.fn((_req: any, _res: any, next: any) => next()),
}));

import prisma from '@infrastructure/database/prisma';
const p = prisma as any;

// ─── Helper: tx con funciones async puras (no jest.Mock) ─────────────────────

function makeTx(historial: Array<{ type: string; quantity: number; unitCost: number }>): any {
  return {
    kardexEntry: { findMany: async () => historial },
    $executeRaw: async () => 0,
  };
}

// ─── CASO 3 — PepsStrategy (unitario puro) ───────────────────────────────────

describe('HU-026 Caso 3 — Algoritmo PEPS (FIFO)', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('PEPS core: 2 compras a distintos costos + 1 venta consume el lote más antiguo primero', async () => {
    /**
     * Lote 1 (COMPRA más antigua): 10 u @ $100
     * Lote 2 (COMPRA más reciente): 10 u @ $120
     * Venta: 12 unidades
     *
     * PEPS consume: 10 u del Lote 1 ($100) + 2 u del Lote 2 ($120)
     * unitCost = (10×100 + 2×120) / 12 = 1240 / 12 = 103.33
     */
    const strategy = new PepsStrategy();
    const result = await strategy.calcularCostoSalida({
      variantId: 1, branchId: 1, quantity: 12,
      tx: makeTx([
        { type: 'COMPRA', quantity: 10, unitCost: 100 },
        { type: 'COMPRA', quantity: 10, unitCost: 120 },
      ]),
    });

    expect(result.unitCost).toBe(103.33);
  });

  it('PEPS: venta cabe íntegramente en el primer lote → unitCost del lote 1', async () => {
    const strategy = new PepsStrategy();
    const result = await strategy.calcularCostoSalida({
      variantId: 1, branchId: 1, quantity: 5,
      tx: makeTx([
        { type: 'COMPRA', quantity: 20, unitCost: 50 },
        { type: 'COMPRA', quantity: 10, unitCost: 80 },
      ]),
    });

    expect(result.unitCost).toBe(50);
  });

  it('PEPS descuenta ventas previas al recalcular lotes disponibles', async () => {
    /**
     * COMPRA 10@100, COMPRA 10@120, VENTA 8 (→ quedan 2 u @ $100 en Lote 1)
     * Nueva venta 5: consume 2@100 + 3@120 = (200+360)/5 = 112
     */
    const strategy = new PepsStrategy();
    const result = await strategy.calcularCostoSalida({
      variantId: 1, branchId: 1, quantity: 5,
      tx: makeTx([
        { type: 'COMPRA', quantity: 10, unitCost: 100 },
        { type: 'COMPRA', quantity: 10, unitCost: 120 },
        { type: 'VENTA',  quantity: 8,  unitCost: 100 },
      ]),
    });

    expect(result.unitCost).toBe(112);
  });

  it('PEPS lanza error cuando la cantidad pedida supera el stock en lotes', async () => {
    const strategy = new PepsStrategy();
    await expect(
      strategy.calcularCostoSalida({
        variantId: 1, branchId: 1, quantity: 10,
        tx: makeTx([{ type: 'COMPRA', quantity: 5, unitCost: 100 }]),
      })
    ).rejects.toThrow('Stock PEPS insuficiente');
  });

  it('KardexService.registrarSalida usa PEPS cuando el método activo es PEPS', async () => {
    (p.inventorySettings.upsert as any).mockResolvedValue({ id: 1, valuationMethod: 'PEPS' });
    (p.branchStock.findUnique as any).mockResolvedValue({ quantity: 20 });
    (p.branchStock.update as any).mockResolvedValue({ quantity: 8 });
    (p.kardexEntry.findFirst as any).mockResolvedValue({ unitCost: 110, balanceCost: 2200, balanceQty: 20 });
    (p.kardexEntry.create as any).mockResolvedValue({ id: 10 });
    (p.kardexEntry.findMany as any).mockResolvedValue([
      { type: 'COMPRA', quantity: 10, unitCost: 100 },
      { type: 'COMPRA', quantity: 10, unitCost: 120 },
    ]);
    (p.$executeRaw as any).mockResolvedValue(0);

    const service = new KardexService();
    await service.registrarSalida({ variantId: 1, branchId: 1, quantity: 12, userId: 5 });

    expect(p.kardexEntry.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ type: 'VENTA', quantity: 12, unitCost: 103.33, userId: 5 }),
    }));
  });

  it('KardexService.registrarSalida usa CPP cuando el método activo es PROMEDIO_PONDERADO', async () => {
    (p.inventorySettings.upsert as any).mockResolvedValue({ id: 1, valuationMethod: 'PROMEDIO_PONDERADO' });
    (p.branchStock.findUnique as any).mockResolvedValue({ quantity: 15 });
    (p.branchStock.update as any).mockResolvedValue({ quantity: 10 });
    (p.kardexEntry.findFirst as any).mockResolvedValue({ unitCost: 75, balanceCost: 1125, balanceQty: 15 });
    (p.kardexEntry.create as any).mockResolvedValue({ id: 11 });

    const service = new KardexService();
    await service.registrarSalida({ variantId: 1, branchId: 1, quantity: 5, userId: 5 });

    expect(p.kardexEntry.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ type: 'VENTA', unitCost: 75 }),
    }));
  });
});
