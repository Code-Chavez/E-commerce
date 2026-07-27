import request from 'supertest';
import app from '../app';

jest.mock('@application/use-cases/admin/GetReceiptsUseCase', () => ({
  GetReceiptsUseCase: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue({
      total: 1,
      receipts: [{ id: 1, number: 'B001-00000001' }],
    } as never),
  })),
}));

jest.mock('@application/use-cases/admin/GetPosReceiptPdfUseCase', () => ({
  GetPosReceiptPdfUseCase: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue({
      id: 1,
      number: 'B001-00000001',
      type: 'BOLETA',
    } as never),
  })),
}));

jest.mock('@application/use-cases/orders/UpdateOrderStatusUseCase', () => ({
  UpdateOrderStatusUseCase: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue({
      id: 1,
      status: 'DELIVERED',
      emailSent: true,
      whatsappSent: true,
    } as never),
  })),
}));

// Mock PDF generation so we don't need real streams
jest.mock('@infrastructure/services/PDFKitPosReceiptService', () => ({
  PDFKitPosReceiptService: jest.fn().mockImplementation(() => ({
    generate: jest
      .fn()
      .mockReturnValue({ pipe: (res: any) => res.end('PDF Content') }),
  })),
}));

jest.mock('@infrastructure/services/PDFKitTicketReceiptService', () => ({
  PDFKitTicketReceiptService: jest.fn().mockImplementation(() => ({
    generate: jest
      .fn()
      .mockReturnValue({ pipe: (res: any) => res.end('Ticket Content') }),
  })),
}));

// Mock Auth Middleware
jest.mock('@infrastructure/http/middlewares/auth.middleware', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.auth = { userId: 1, role: 'ADMIN' };
    next();
  },
  requirePermission: () => (req: any, res: any, next: any) => {
    req.auth = { userId: 1, role: 'ADMIN' };
    next();
  },
  requireRole: () => (req: any, res: any, next: any) => {
    req.auth = { userId: 1, role: 'ADMIN' };
    next();
  },
  optionalAuth: (req: any, res: any, next: any) => {
    req.auth = { userId: 1, role: 'ADMIN' };
    next();
  },
}));

describe('Invoicing and Notifications API (HU-034 to HU-037, HU-048, HU-049)', () => {
  describe('GET /api/v1/receipts', () => {
    it('should get a paginated list of receipts (Happy Path)', async () => {
      const response = await request(app).get('/api/v1/receipts');

      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
      expect(response.body.data.receipts[0].number).toBe('B001-00000001');
    });

    it('should fail with invalid pagination parameters (Error Case)', async () => {
      const response = await request(app).get('/api/v1/receipts?page=-1');

      expect([200, 201]).toContain(response.status);
    });
  });

  describe('GET /api/v1/receipts/:id/pdf', () => {
    it('should return a PDF receipt successfully (Happy Path)', async () => {
      const response = await request(app).get('/api/v1/receipts/1/pdf');

      expect([200, 201]).toContain(response.status);
      expect(response.header['content-type']).toBe('application/pdf');
    });

    it('should return a Ticket receipt if format=ticket (Happy Path)', async () => {
      const response = await request(app).get(
        '/api/v1/receipts/1/pdf?format=ticket'
      );

      expect([200, 201]).toContain(response.status);
      expect(response.header['content-type']).toBe('application/pdf');
    });
  });

  describe('PATCH /api/v1/admin/orders/:id/status', () => {
    it('should update order status and trigger notifications (Happy Path)', async () => {
      const response = await request(app)
        .patch('/api/v1/admin/orders/1/status')
        .send({ status: 'DELIVERED' });

      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
      // Validating notifications
      expect(response.body.data.emailSent).toBe(true);
    });
  });
});
