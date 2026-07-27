import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../app';
import prisma from '@infrastructure/database/prisma';

jest.mock('@infrastructure/database/prisma', () => {
  const mockSupplier = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const mockStockEntry = {
    create: jest.fn(),
  };
  const mockBranchStock = {
    findUnique: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    upsert: jest.fn(),
  };
  const mockKardexEntry = {
    create: jest.fn(),
    findFirst: jest.fn(),
  };

  const mockPrisma: any = {
    supplier: mockSupplier,
    stockEntry: mockStockEntry,
    branchStock: mockBranchStock,
    kardexEntry: mockKardexEntry,
    $transaction: jest.fn().mockImplementation(async (callback: any) => callback(mockPrisma)),
  };

  return { __esModule: true, default: mockPrisma };
});

jest.mock('@infrastructure/http/middlewares/auth.middleware', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.auth = { userId: 1, role: 'ADMIN' };
    next();
  },
  requirePermission: () => (req: any, res: any, next: any) => next(),
  optionalAuth: (req: any, res: any, next: any) => next(),
}));

describe('Supplier & Stock Entry API (HU-051)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/suppliers', () => {
    it('should return a list of suppliers', async () => {
      const mockSuppliers = [{ id: 1, ruc: '12345678901', razonSocial: 'Proveedor A' }];
      (prisma.supplier.findMany as any).mockResolvedValue(mockSuppliers);

      const response = await request(app).get('/api/v1/suppliers');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSuppliers);
    });
  });

  describe('POST /api/v1/suppliers', () => {
    it('should create a new supplier', async () => {
      const mockPayload = { ruc: '12345678901', razonSocial: 'Proveedor A', contacto: 'Juan', rubro: 'Tecnología' };
      const mockCreated = { id: 1, ...mockPayload };

      (prisma.supplier.findFirst as any).mockResolvedValue(null);
      (prisma.supplier.create as any).mockResolvedValue(mockCreated);

      const response = await request(app)
        .post('/api/v1/suppliers')
        .send(mockPayload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockCreated);
    });

    it('should fail if RUC already exists', async () => {
      const mockPayload = { ruc: '12345678901', razonSocial: 'Proveedor A', contacto: 'Juan', rubro: 'Tecnología' };
      (prisma.supplier.findUnique as any).mockResolvedValue({ id: 1 });

      const response = await request(app)
        .post('/api/v1/suppliers')
        .send(mockPayload);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('registrado');
    });

    it('should fail validation if RUC is invalid', async () => {
      const response = await request(app)
        .post('/api/v1/suppliers')
        .send({ ruc: '123', razonSocial: 'A', contacto: 'J', rubro: 'T' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('PUT /api/v1/suppliers/:id', () => {
    it('should update a supplier', async () => {
      const mockPayload = { razonSocial: 'Proveedor B', rubro: 'Mobiliario' };
      const mockUpdated = { id: 1, ruc: '12345678901', razonSocial: 'Proveedor B', rubro: 'Mobiliario' };

      (prisma.supplier.findUnique as any).mockResolvedValue({ id: 1 });
      (prisma.supplier.update as any).mockResolvedValue(mockUpdated);

      const response = await request(app)
        .put('/api/v1/suppliers/1')
        .send(mockPayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockUpdated);
    });
  });

  describe('PATCH /api/v1/suppliers/:id/status', () => {
    it('should toggle supplier status', async () => {
      (prisma.supplier.findUnique as any).mockResolvedValue({ id: 1 });
      (prisma.supplier.update as any).mockResolvedValue({ id: 1, isActive: false });

      const response = await request(app)
        .patch('/api/v1/suppliers/1/status')
        .send({ isActive: false });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/stock/entries', () => {
    it('should register a stock entry successfully', async () => {
      const mockPayload = {
        supplierId: 1,
        branchId: 1,
        invoiceNumber: 'F001-001',
        items: [{ variantId: 1, quantity: 10, unitCost: 10 }],
      };

      (prisma.supplier.findUnique as any).mockResolvedValue({ id: 1, isActive: true, razonSocial: 'Proveedor A' });
      (prisma.branchStock.findUnique as any).mockResolvedValue({ id: 1, quantity: 5 });
      (prisma.branchStock.upsert as any).mockResolvedValue({});
      (prisma.branchStock.update as any).mockResolvedValue({});
      (prisma.stockEntry.create as any).mockResolvedValue({
        id: 1,
        supplierId: 1,
        invoiceNumber: 'F001-001',
        branchId: 1,
        supplier: {
          id: 1,
          ruc: '12345678901',
          razonSocial: 'Proveedor A',
          contacto: 'Juan',
          direccion: 'Direccion',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        items: [{ id: 1, stockEntryId: 1, variantId: 1, quantity: 10, unitCost: 10 }],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (prisma.kardexEntry.findFirst as any).mockResolvedValue(null);
      (prisma.kardexEntry.create as any).mockResolvedValue({});

      const response = await request(app)
        .post('/api/v1/stock/entries')
        .send(mockPayload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(prisma.stockEntry.create).toHaveBeenCalled();
    });

    it('should fail if supplier does not exist or is inactive', async () => {
      const mockPayload = {
        supplierId: 99,
        branchId: 1,
        invoiceNumber: 'F001-001',
        items: [{ variantId: 1, quantity: 10, unitCost: 10 }],
      };

      (prisma.supplier.findUnique as any).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/stock/entries')
        .send(mockPayload);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('no existe');
    });
  });
});
