import prisma from '@infrastructure/database/prisma';

export interface PosReceiptData {
  orderId: number;
  createdAt: Date;
  status: string;
  subtotal: number;
  discountTotal: number;
  total: number;
  isCrossBranch: boolean;
  isPickup?: boolean;
  documentType: 'BOLETA' | 'FACTURA' | 'TICKET';
  series?: string | null;
  correlative?: number | null;
  igvExempt: boolean;
  branch: { id: number; name: string; address: string | null };
  sourceBranch: { id: number; name: string } | null;
  seller: { name: string; lastName: string | null; email: string } | null;
  client: {
    name: string;
    lastName: string | null;
    documentType: string | null;
    documentId: string | null;
  } | null;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
    lineTotal: number;
  }>;
  payments: Array<{ method: string; amount: number }>;
}

export class GetPosReceiptPdfUseCase {
  async execute(orderId: number): Promise<PosReceiptData> {
    const order = await prisma.posOrder.findUnique({
      where: { id: orderId },
      include: {
        branch: {
          select: { id: true, name: true, address: true, igvExempt: true },
        },
        sourceBranch: { select: { id: true, name: true } },
        items: {
          include: {
            variant: {
              include: {
                product: { select: { name: true } },
              },
            },
          },
        },
        payments: { select: { method: true, amount: true } },
      },
    });

    if (!order) throw new Error(`Comprobante #${orderId} no encontrado`);

    let seller = null;
    if (order.userId) {
      const user = await prisma.user.findUnique({
        where: { id: order.userId },
        select: { name: true, lastName: true, email: true },
      });
      if (user)
        seller = {
          name: user.name || 'Vendedor',
          lastName: user.lastName,
          email: user.email,
        };
    }

    let client = null;
    if (order.userId) {
      const dbClient = await prisma.client.findFirst({
        where: { userId: order.userId },
        select: {
          name: true,
          lastName: true,
          documentType: true,
          documentId: true,
        },
      });
      if (dbClient) client = dbClient;
    }

    return {
      orderId: order.id,
      createdAt: order.createdAt,
      status: order.status,
      subtotal: Number(order.subtotal),
      discountTotal: Number(order.discountTotal),
      total: Number(order.total),
      igvExempt: order.branch.igvExempt,
      isCrossBranch: order.isCrossBranch,
      documentType: order.documentType as any,
      series: order.series,
      correlative: order.correlative,
      branch: order.branch,
      sourceBranch: order.sourceBranch,
      seller,
      client,
      items: order.items.map((item) => ({
        productName: item.variant.product.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        discountAmount: Number(item.discountAmount),
        lineTotal: Number(item.lineTotal),
      })),
      payments: order.payments.map((p) => ({
        method: p.method,
        amount: Number(p.amount),
      })),
    };
  }
}
