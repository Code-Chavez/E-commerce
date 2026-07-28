import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../app';
import { Readable } from 'stream';

var mockGetReceiptsExecute = jest.fn();
jest.mock('@application/use-cases/admin/GetReceiptsUseCase', () => {
  return {
    GetReceiptsUseCase: jest.fn().mockImplementation(() => ({
      execute: (...args: any[]) => mockGetReceiptsExecute(...args),
    })),
  };
});

var mockGetPosReceiptPdfExecute = jest.fn();
jest.mock('@application/use-cases/admin/GetPosReceiptPdfUseCase', () => {
  return {
    GetPosReceiptPdfUseCase: jest.fn().mockImplementation(() => ({
      execute: (...args: any[]) => mockGetPosReceiptPdfExecute(...args),
    })),
  };
});

var mockPdfGenerate = jest.fn().mockImplementation(() => {
  const stream = new Readable();
  stream.push('mock pdf content');
  stream.push(null);
  return stream;
});

jest.mock('@infrastructure/services/PDFKitPosReceiptService', () => {
  return {
    PDFKitPosReceiptService: jest.fn().mockImplementation(() => ({
      generate: (...args: any[]) => mockPdfGenerate(...args),
    })),
  };
});

var mockTicketGenerate = jest.fn().mockImplementation(() => {
  const stream = new Readable();
  stream.push('mock ticket content');
  stream.push(null);
  return stream;
});

jest.mock('@infrastructure/services/PDFKitTicketReceiptService', () => {
  return {
    PDFKitTicketReceiptService: jest.fn().mockImplementation(() => ({
      generate: (...args: any[]) => mockTicketGenerate(...args),
    })),
  };
});

jest.mock('@infrastructure/http/middlewares/auth.middleware', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.auth = { userId: 1, role: 'ADMIN' };
    next();
  },
  requirePermission: () => (req: any, res: any, next: any) => next(),
  optionalAuth: (req: any, res: any, next: any) => next(),
}));

describe('Receipt API (HU-055)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/receipts/:id/pdf', () => {
    it('should return a PDF receipt for A4 format by default', async () => {
      mockGetPosReceiptPdfExecute.mockResolvedValue({
        id: 1,
        type: 'FACTURA',
      } as never);

      const response = await request(app).get('/api/v1/receipts/1/pdf');

      expect(response.status).toBe(200);
      expect(response.header['content-type']).toBe('application/pdf');
      expect(response.header['content-disposition']).toContain('attachment');
      expect(mockPdfGenerate).toHaveBeenCalled();
      expect(mockTicketGenerate).not.toHaveBeenCalled();
    });

    it('should return a ticket receipt if format=ticket', async () => {
      mockGetPosReceiptPdfExecute.mockResolvedValue({
        id: 2,
        type: 'BOLETA',
      } as never);

      const response = await request(app).get(
        '/api/v1/receipts/2/pdf?format=ticket'
      );

      expect(response.status).toBe(200);
      expect(response.header['content-type']).toBe('application/pdf');
      expect(mockTicketGenerate).toHaveBeenCalled();
    });

    it('should fail if ID is invalid', async () => {
      const response = await request(app).get('/api/v1/receipts/abc/pdf');
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 if receipt not found', async () => {
      mockGetPosReceiptPdfExecute.mockRejectedValue(
        new Error('Comprobante no encontrado') as never
      );

      const response = await request(app).get('/api/v1/receipts/999/pdf');
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('encontrado');
    });
  });

  describe('GET /api/v1/receipts', () => {
    it('should list receipts with pagination and filters', async () => {
      const mockResult = {
        data: [{ id: 1, type: 'FACTURA' }],
        meta: { page: 1, limit: 10, total: 1 },
      };
      mockGetReceiptsExecute.mockResolvedValue(mockResult as never);

      const response = await request(app).get(
        '/api/v1/receipts?page=1&limit=10&branchId=1'
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResult);
      expect(mockGetReceiptsExecute).toHaveBeenCalledWith({
        branchId: 1,
        from: undefined,
        to: undefined,
        type: undefined,
        page: 1,
        limit: 10,
      });
    });

    it('should parse date filters correctly', async () => {
      mockGetReceiptsExecute.mockResolvedValue({ data: [] } as never);

      await request(app).get('/api/v1/receipts?from=2023-01-01&to=2023-01-31');

      expect(mockGetReceiptsExecute).toHaveBeenCalled();
      const callArgs = mockGetReceiptsExecute.mock.calls[0][0] as any;
      expect(callArgs.from).toBeInstanceOf(Date);
      expect(callArgs.to).toBeInstanceOf(Date);
    });
  });
});
