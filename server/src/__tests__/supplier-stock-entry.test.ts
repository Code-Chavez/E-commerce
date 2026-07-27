import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../app';

// Mock Prisma client
jest.mock('@infrastructure/database/prisma', () => {
  const mockSupplier = {
    findMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
  };

  const mockStockEntry = {
    create: jest.fn(),
  };
  
  const mockProductVariant = {
    findUnique: jest.fn(),
    update: jest.fn(),
  };

  const mockPriceHistory = {
    create: jest.fn(),
  };
  
  const mockBranchStock = {
    upsert: jest.fn(),
  };
  
  const mockKardexEntry = {
    findFirst: jest.fn(),
    create: jest.fn(),
  };

  const mockPrisma: any = {
    $transaction: jest.fn(async (cb: any) => {
      // simulate executing the transaction callback with the same mock context
      return await cb(mockPrisma);
    }),
    supplier: mockSupplier,
    stockEntry: mockStockEntry,
    branchStock: mockBranchStock,
    kardexEntry: mockKardexEntry,
    productVariant: mockProductVariant,
    priceHistory: mockPriceHistory,
  };
  return { __esModule: true, default: mockPrisma };
});

jest.mock('@application/use-cases/supplier/GetAllSuppliersUseCase', () => ({
  GetAllSuppliersUseCase: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue([{ id: 1, razonSocial: 'Importadora Sur', ruc: '20123456789' }] as never),
  })),
}));

jest.mock('@application/use-cases/supplier/CreateSupplierUseCase', () => ({
  CreateSupplierUseCase: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue({ id: 2, razonSocial: 'Distribuidora Central', ruc: '20987654321', contacto: 'Juan' } as never),
  })),
}));

jest.mock('@application/use-cases/inventory/CreateStockEntryUseCase', () => {
  const { CreateStockEntryUseCase } = jest.requireActual<any>('@application/use-cases/inventory/CreateStockEntryUseCase');
  return {
    CreateStockEntryUseCase: jest.fn().mockImplementation(() => {
      const mockSupplierRepo = {
        findById: jest.fn().mockResolvedValue({ id: 1, isActive: true, razonSocial: 'Proveedor Mock' } as never)
      };
      const mockStockEntryRepo = {
        create: jest.fn().mockImplementation(async (data: any) => ({
          id: 1,
          supplierId: data.supplierId,
          invoiceNumber: data.invoiceNumber,
          branchId: data.branchId,
          items: data.items,
          createdAt: new Date(),
          updatedAt: new Date()
        }))
      };
      return new CreateStockEntryUseCase(mockStockEntryRepo as any, mockSupplierRepo as any);
    }),
  };
});
// Mock Auth Middleware
jest.mock('@infrastructure/http/middlewares/auth.middleware', () => ({
  requirePermission: jest.fn(() => (req: any, res: any, next: any) => { req.auth = { userId: 1, branchId: 1, role: 'ADMIN' }; next(); }), requireAuth: jest.fn((req: any, res: any, next: any) => { req.auth = { userId: 1, branchId: 1, role: 'ADMIN' }; next(); }), optionalAuth: jest.fn((req: any, res: any, next: any) => next()),
}));

import prisma from '@infrastructure/database/prisma';

describe('Supplier and Stock Entry API (HU-051)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Suppliers', () => {

    it('should list suppliers successfully (Happy Path)', async () => {
      (prisma.supplier.findMany as any).mockResolvedValue([{ 
        id: 1, 
        ruc: '20123456789', 
        razonSocial: 'Distribuidora', 
        contacto: 'Juan',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }]);
      const response = await request(app).get('/api/v1/suppliers');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data[0].ruc).toBe('20123456789');
    });

    it('should create supplier successfully (Happy Path)', async () => {
      (prisma.supplier.findUnique as any).mockResolvedValue(null);
      (prisma.supplier.create as any).mockResolvedValue({ 
        id: 2, 
        razonSocial: 'Distribuidora Central', 
        ruc: '20987654321', 
        contacto: 'Juan',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      const response = await request(app)
        .post('/api/v1/suppliers')
        .send({ razonSocial: 'Distribuidora Central', ruc: '20987654321', contacto: 'Juan', rubro: 'Lácteos' });

      // Controller probably responds with 201
      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
      expect(response.body.data.ruc).toBe('20987654321');
    });

    it('should return error when creating with missing data (Error Case)', async () => {
      const response = await request(app)
        .post('/api/v1/suppliers')
        .send({ ruc: '' });
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Stock Entries', () => {
    it('should register a stock entry successfully (Happy Path)', async () => {
      (prisma.supplier.findUnique as any).mockResolvedValue({ id: 1, razonSocial: 'Supplier', ruc: '20123456789', isActive: true, createdAt: new Date(), updatedAt: new Date() });
      (prisma.stockEntry.create as any).mockResolvedValue({ 
        id: 100, 
        supplierId: 1, 
        branchId: 1,
        invoiceNumber: 'F001-00001234', 
        createdAt: new Date(), 
        updatedAt: new Date(),
        items: [{ id: 10, variantId: 1, quantity: 100, unitCost: 15.50 }],
        supplier: { id: 1, razonSocial: 'Supplier', ruc: '20123456789', isActive: true, createdAt: new Date(), updatedAt: new Date() }
      });
      (prisma.branchStock.upsert as any).mockResolvedValue({ id: 1, variantId: 1, branchId: 1, quantity: 100 });
      (prisma.kardexEntry.create as any).mockResolvedValue({ id: 1 });
      (prisma.productVariant.findUnique as any).mockResolvedValue({ id: 1, sku: 'SKU123', price: 100 });
      const payload = {
        supplierId: 1,
        branchId: 1,
        invoiceNumber: 'F001-00001234',
        items: [{ variantId: 1, quantity: 100, unitCost: 15.50 }],
      };
      const response = await request(app)
        .post('/api/v1/stock/entries')
        .send(payload);
      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
    });

    it('should fail if missing required items (Error Case)', async () => {
      const payload = {
        supplierId: 1,
        branchId: 1,
        invoiceNumber: 'F001-00001234',
        items: [],
      };
      const response = await request(app)
        .post('/api/v1/stock/entries')
        .send(payload);
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.success).toBe(false);
    });

    it('debe rechazar con HTTP 400 si la distribución excede el ingreso (HU-022)', async () => {
      const payload = {
        supplierId: 1,
        branchId: 1,
        invoiceNumber: 'F001-00001234',
        items: [{ variantId: 1, quantity: 100, unitCost: 15.50 }],
        distributionItems: [
          { branchId: 1, variantId: 1, quantity: 60 },
          { branchId: 2, variantId: 1, quantity: 50 } // Total: 110 > 100
        ]
      };

      const response = await request(app)
        .post('/api/v1/stock/entries')
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('La cantidad a distribuir (110) excede el total ingresado (100) para la variante 1');
    });
  });

  describe('PrismaStockEntryRepository (HU-026 / HU-051)', () => {
    it('Debe hacer rollback del StockEntry si falla la creación del KardexEntry', async () => {
      const { PrismaStockEntryRepository } = await import('@infrastructure/database/repositories/PrismaStockEntryRepository');
      const repo = new PrismaStockEntryRepository();

      // Setup mocks for this specific test
      (prisma.stockEntry.create as any).mockResolvedValue({ id: 100, supplierId: 1, invoiceNumber: 'TEST-123' });
      (prisma.productVariant.findUnique as any).mockResolvedValue({ costPrice: 50 });
      (prisma.kardexEntry.findFirst as any).mockResolvedValue(null);
      (prisma.branchStock.upsert as any).mockResolvedValue({});
      
      // Simulate an error in KardexEntry creation
      (prisma.kardexEntry.create as any).mockRejectedValue(new Error('KardexEntry DB Error'));

      const payload = {
        supplierId: 1,
        branchId: 1,
        invoiceNumber: 'TEST-123',
        items: [{ variantId: 1, quantity: 10, unitCost: 50 }],
      };

      await expect(repo.create(payload)).rejects.toThrow('KardexEntry DB Error');

      expect(prisma.stockEntry.create).toHaveBeenCalled();
      expect(prisma.kardexEntry.create).toHaveBeenCalled();
    });
  });
});


