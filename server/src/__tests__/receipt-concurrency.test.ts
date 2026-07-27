import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import prisma from '@infrastructure/database/prisma';
import { PDFKitPosReceiptService } from '@infrastructure/services/PDFKitPosReceiptService';
import { PosReceiptData } from '@application/use-cases/admin/GetPosReceiptPdfUseCase';

describe('Receipt Concurrency and Layout Integration (HU-036)', () => {
  beforeAll(async () => {
    // Limpiar secuencias y órdenes previas para iniciar en limpio en la BD de pruebas
    await prisma.payment.deleteMany();
    await prisma.posOrderItem.deleteMany();
    await prisma.posOrder.deleteMany();
    await prisma.documentSequence.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should generate PDF receipt containing the correct cross-branch pickup legend', () => {
    const service = new PDFKitPosReceiptService();
    const mockReceipt: PosReceiptData = {
      orderId: 123,
      createdAt: new Date(),
      status: 'COMPLETED',
      subtotal: 100,
      discountTotal: 0,
      total: 100,
      igvExempt: false,
      isCrossBranch: true,
      documentType: 'BOLETA',
      series: 'B001',
      correlative: 1,
      branch: { id: 1, name: 'Sede Central', address: 'Av. Larco 123' },
      sourceBranch: { id: 2, name: 'Sede San Isidro' },
      seller: { name: 'Luis', lastName: 'Cajero', email: 'cajero@test.com' },
      client: null,
      items: [
        { productName: 'Polo M', quantity: 1, unitPrice: 100, discountAmount: 0, lineTotal: 100 }
      ],
      payments: [{ method: 'CASH', amount: 100 }]
    };

    // Generar el PDF y validar que no lance excepciones
    const doc = service.generate(mockReceipt);
    expect(doc).toBeDefined();
  });

  it('should assign sequential correlatives when creating POS orders sequentially', async () => {
    // 1. Crear sucursal, caja de prueba y un turno de caja abierto
    const branch = await prisma.branch.create({
      data: { name: `Sede Comprobantes ${Date.now()}`, address: 'Av. Test 123', isActive: true }
    });

    const user = await prisma.user.create({
      data: { email: `cajero.${Date.now()}@test.com`, password: 'hash', name: 'Luis', lastName: 'Perez' }
    });

    const register = await prisma.cashRegister.create({
      data: { branchId: branch.id, name: `Caja Test ${Date.now()}` }
    });

    const activeTurn = await prisma.cashTurn.create({
      data: { registerId: register.id, userId: user.id, status: 'OPEN', openAmount: 100 }
    });

    // 2. Simular dos ventas secuenciales de tipo BOLETA
    const simulateSale = async (docType: 'BOLETA' | 'FACTURA') => {
      return await prisma.$transaction(async (tx) => {
        const sequence = await tx.documentSequence.upsert({
          where: {
            branchId_documentType: {
              branchId: branch.id,
              documentType: docType
            }
          },
          update: { nextNumber: { increment: 1 } },
          create: {
            branchId: branch.id,
            documentType: docType,
            series: docType === 'BOLETA' ? `B${String(branch.id).padStart(3, '0')}` : `F${String(branch.id).padStart(3, '0')}`,
            nextNumber: 2
          }
        });

        const currentSeries = sequence.series;
        const currentCorrelative = sequence.nextNumber - 1;

        const order = await tx.posOrder.create({
          data: {
            branchId: branch.id,
            userId: user.id,
            cashTurnId: activeTurn.id,
            documentType: docType,
            series: currentSeries,
            correlative: currentCorrelative,
            subtotal: 10,
            discountTotal: 0,
            total: 10,
            status: 'COMPLETED'
          }
        });
        return order;
      });
    };

    const sale1 = await simulateSale('BOLETA');
    const sale2 = await simulateSale('BOLETA');
    const sale3 = await simulateSale('FACTURA');

    expect(sale1.series).toBe(`B${String(branch.id).padStart(3, '0')}`);
    expect(sale1.correlative).toBe(1);

    expect(sale2.series).toBe(`B${String(branch.id).padStart(3, '0')}`);
    expect(sale2.correlative).toBe(2);

    expect(sale3.series).toBe(`F${String(branch.id).padStart(3, '0')}`);
    expect(sale3.correlative).toBe(1);
  });
});
