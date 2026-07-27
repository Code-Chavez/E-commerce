import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { PDFKitPosReceiptService } from '../infrastructure/services/PDFKitPosReceiptService';
import { PDFKitTicketReceiptService } from '../infrastructure/services/PDFKitTicketReceiptService';
import PDFDocument from 'pdfkit';

jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => {
    return {
      fillColor: jest.fn().mockReturnThis(),
      fontSize: jest.fn().mockReturnThis(),
      font: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      moveTo: jest.fn().mockReturnThis(),
      lineTo: jest.fn().mockReturnThis(),
      strokeColor: jest.fn().mockReturnThis(),
      stroke: jest.fn().mockReturnThis(),
      addPage: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
    };
  });
});

describe('PDFKit Receipt Services', () => {
  const mockReceipt: any = {
    orderId: 1,
    createdAt: new Date(),
    status: 'OPEN',
    subtotal: 100,
    discountTotal: 0,
    total: 100,
    isCrossBranch: false,
    branch: { id: 1, name: 'Main', address: 'Lima' },
    sourceBranch: null,
    seller: null,
    client: null,
    items: [],
    payments: [],
  };

  const expectedLegend =
    'PARA RECOJO EN TIENDA: Conserve este comprobante. Preséntelo junto con su documento de identidad en la sucursal seleccionada para retirar su pedido. Plazo máximo de recojo: 7 días calendario desde la fecha de emisión.';

  describe('PDFKitPosReceiptService', () => {
    let service: PDFKitPosReceiptService;

    beforeEach(() => {
      service = new PDFKitPosReceiptService();
      jest.clearAllMocks();
    });

    it('should NOT print the legend if isPickup is false or undefined', () => {
      service.generate({ ...mockReceipt, isPickup: false });

      const pdfMock = (PDFDocument as unknown as jest.Mock).mock.results[0]
        .value as any;
      const textCalls = pdfMock.text.mock.calls.map((call: any[]) => call[0]);

      expect(textCalls).not.toContain(expectedLegend);
    });

    it('should print the legend EXACTLY if isPickup is true (recojo en tienda)', () => {
      service.generate({ ...mockReceipt, isPickup: true });

      const pdfMock = (PDFDocument as unknown as jest.Mock).mock.results[0]
        .value as any;
      const textCalls = pdfMock.text.mock.calls.map((call: any[]) => call[0]);

      expect(textCalls).toContain(expectedLegend);
    });
  });

  describe('PDFKitTicketReceiptService', () => {
    let service: PDFKitTicketReceiptService;

    beforeEach(() => {
      service = new PDFKitTicketReceiptService();
      jest.clearAllMocks();
    });

    it('should NOT print the legend if isPickup is false or undefined', () => {
      service.generate({ ...mockReceipt, isPickup: false });

      const pdfMock = (PDFDocument as unknown as jest.Mock).mock.results[0]
        .value as any;
      const textCalls = pdfMock.text.mock.calls.map((call: any[]) => call[0]);

      expect(textCalls).not.toContain(expectedLegend);
    });

    it('should print the legend EXACTLY if isPickup is true (recojo en tienda)', () => {
      service.generate({ ...mockReceipt, isPickup: true });

      const pdfMock = (PDFDocument as unknown as jest.Mock).mock.results[0]
        .value as any;
      const textCalls = pdfMock.text.mock.calls.map((call: any[]) => call[0]);

      expect(textCalls).toContain(expectedLegend);
    });
  });
});
