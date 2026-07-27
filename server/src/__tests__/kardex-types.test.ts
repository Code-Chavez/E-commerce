/**
 * HU-026 Audit Fix — Tests Mandatorios Nivel C
 * Caso 1: Verifica que cada tipo de movimiento guarda el type y userId correctos.
 * Caso 2: Verifica el filtro por type en GET /api/v1/kardex.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../app';

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
      upsert: jest.fn(),
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

// ─── Mock RequestContext ──────────────────────────────────────────────────────

jest.mock('@infrastructure/context/RequestContext', () => ({
  requestContext: {
    getStore: jest.fn().mockReturnValue({ userId: 99, email: 'test@test.com' }),
    run: jest.fn((_store: any, cb: any) => cb()),
  },
  requestContextMiddleware: jest.fn((_req: any, _res: any, next: any) => next()),
}));

// ─── Mock Auth Middleware ─────────────────────────────────────────────────────

jest.mock('@infrastructure/http/middlewares/auth.middleware', () => ({
  requirePermission: jest.fn(() => (req: any, _res: any, next: any) => {
    req.auth = { userId: 99, branchId: 1, role: 'ADMIN' };
    next();
  }),
  requireAuth: jest.fn((req: any, _res: any, next: any) => {
    req.auth = { userId: 99, branchId: 1, role: 'ADMIN' };
    next();
  }),
  optionalAuth: jest.fn((_req: any, _res: any, next: any) => next()),
}));

// ─── Imports post-mock ───────────────────────────────────────────────────────

import prisma from '@infrastructure/database/prisma';
import { KardexService } from '@application/use-cases/inventory/KardexService';

const p = prisma as any;
const USER_ID = 99;

// ─── CASO 1: Tipos y userId en cada movimiento ────────────────────────────────

describe('HU-026 Caso 1 — Tipos y userId en KardexEntry', () => {
  const service = new KardexService();

  beforeEach(() => {
    jest.clearAllMocks();
    (p.inventorySettings.upsert as any).mockResolvedValue({ id: 1, valuationMethod: 'PROMEDIO_PONDERADO' });
    (p.$executeRaw as any).mockResolvedValue(0);
  });

  it('COMPRA: registrarEntrada guarda type=COMPRA y userId=99', async () => {
    (p.branchStock.findUnique as any).mockResolvedValue(null);
    (p.branchStock.upsert as any).mockResolvedValue({ quantity: 10 });
    (p.kardexEntry.findFirst as any).mockResolvedValue(null);
    (p.kardexEntry.create as any).mockResolvedValue({ id: 1 });

    await service.registrarEntrada({ variantId: 1, branchId: 1, quantity: 10, unitCost: 100, userId: USER_ID });

    expect(p.kardexEntry.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ type: 'COMPRA', userId: USER_ID, quantity: 10 }),
    }));
  });

  it('VENTA: registrarSalida guarda type=VENTA y userId=99 (CPP)', async () => {
    (p.branchStock.findUnique as any).mockResolvedValue({ quantity: 20 });
    (p.branchStock.update as any).mockResolvedValue({ quantity: 15 });
    (p.kardexEntry.findFirst as any).mockResolvedValue({ unitCost: 50, balanceCost: 1000, balanceQty: 20 });
    (p.kardexEntry.create as any).mockResolvedValue({ id: 2 });

    await service.registrarSalida({ variantId: 1, branchId: 1, quantity: 5, userId: USER_ID });

    expect(p.kardexEntry.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ type: 'VENTA', userId: USER_ID, quantity: 5 }),
    }));
  });

  it('AJUSTE: StockAdjustmentController guarda type=AJUSTE y userId=99 via RequestContext', async () => {
    (p.branchStock.findUnique as any).mockResolvedValue({ quantity: 10 });
    (p.kardexEntry.findFirst as any).mockResolvedValue({ unitCost: 40, balanceCost: 400, balanceQty: 10 });
    (p.branchStock.upsert as any).mockResolvedValue({ quantity: 12 });
    (p.kardexEntry.create as any).mockResolvedValue({ id: 3, type: 'AJUSTE' });

    const res = await request(app)
      .post('/api/v1/stock/adjustments')
      .send({ variantId: 1, branchId: 1, newQuantity: 12, reason: 'Corrección de inventario físico' });

    expect(res.status).toBe(201);
    expect(p.kardexEntry.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ type: 'AJUSTE', userId: USER_ID }),
    }));
  });

  it('userId se obtiene de RequestContext cuando no se pasa explícitamente', async () => {
    (p.branchStock.findUnique as any).mockResolvedValue(null);
    (p.branchStock.upsert as any).mockResolvedValue({ quantity: 5 });
    (p.kardexEntry.findFirst as any).mockResolvedValue(null);
    (p.kardexEntry.create as any).mockResolvedValue({ id: 4 });

    await service.registrarEntrada({ variantId: 2, branchId: 1, quantity: 5, unitCost: 80 });

    expect(p.kardexEntry.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ type: 'COMPRA', userId: USER_ID }),
    }));
  });
});

// ─── CASO 2: Filtro por type en GET /api/v1/kardex ───────────────────────────

describe('HU-026 Caso 2 — Filtro por type en GET /api/v1/kardex', () => {
  const mockCompra = {
    id: 1, type: 'COMPRA', quantity: 10, unitCost: 100, balanceQty: 10,
    balanceCost: 1000, createdAt: new Date(),
    variant: { sku: 'SKU-001' }, branch: { name: 'Principal' },
  };
  const mockVenta = {
    id: 2, type: 'VENTA', quantity: 3, unitCost: 100, balanceQty: 7,
    balanceCost: 700, createdAt: new Date(),
    variant: { sku: 'SKU-001' }, branch: { name: 'Principal' },
  };

  beforeEach(() => { jest.clearAllMocks(); });

  it('sin filtro type devuelve todos los asientos', async () => {
    (p.kardexEntry.findMany as any).mockResolvedValue([mockCompra, mockVenta]);

    const res = await request(app).get('/api/v1/kardex?variantId=1&branchId=1');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(p.kardexEntry.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.not.objectContaining({ type: expect.anything() }),
    }));
  });

  it('con type=COMPRA devuelve solo asientos COMPRA y filtra en Prisma', async () => {
    (p.kardexEntry.findMany as any).mockResolvedValue([mockCompra]);

    const res = await request(app).get('/api/v1/kardex?variantId=1&branchId=1&type=COMPRA');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].type).toBe('COMPRA');
    expect(p.kardexEntry.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ type: 'COMPRA' }),
    }));
  });

  it('con type=VENTA devuelve solo asientos VENTA', async () => {
    (p.kardexEntry.findMany as any).mockResolvedValue([mockVenta]);

    const res = await request(app).get('/api/v1/kardex?variantId=1&branchId=1&type=VENTA');

    expect(res.status).toBe(200);
    expect(res.body.data[0].type).toBe('VENTA');
  });

  it('type inválido retorna HTTP 400', async () => {
    const res = await request(app).get('/api/v1/kardex?variantId=1&branchId=1&type=INVALIDO');
    expect(res.status).toBe(400);
  });
});
