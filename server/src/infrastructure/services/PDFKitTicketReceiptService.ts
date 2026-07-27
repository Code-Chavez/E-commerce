import PDFDocument from 'pdfkit';
import { PosReceiptData } from '@application/use-cases/admin/GetPosReceiptPdfUseCase';

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
  YAPE: 'Yape',
};

const W = 226;   // 80 mm en puntos
const M = 10;    // margen
const CW = W - M * 2;

function divider(doc: PDFKit.PDFDocument, y: number): void {
  doc.moveTo(M, y).lineTo(W - M, y).strokeColor('#AAAAAA').stroke();
}

export class PDFKitTicketReceiptService {
  generate(receipt: PosReceiptData): PDFKit.PDFDocument {
    const itemLines = receipt.items.reduce(
      (acc, item) => acc + 2 + (item.discountAmount > 0 ? 1 : 0),
      0,
    );
    const estimatedHeight =
      180 +
      (receipt.seller ? 30 : 0) +
      (receipt.client ? 40 : 0) +
      itemLines * 13 +
      receipt.payments.length * 15 +
      80;

    const doc = new PDFDocument({ margin: M, size: [W, estimatedHeight] });
    const dark = '#2D2D2D';
    const gray = '#6B6B6B';

    let y = M;

    // ── Cabecera ────────────────────────────────────────────────────────────────
    doc.fillColor(dark).fontSize(13).font('Helvetica-Bold')
       .text("D'MENDOZA", M, y, { width: CW, align: 'center' });
    y += 17;

    doc.fontSize(7).font('Helvetica')
       .text("D'Mendoza S.A.C.", M, y, { width: CW, align: 'center' });
    y += 11;
    doc.text('RUC: 20609876543', M, y, { width: CW, align: 'center' });
    y += 11;
    doc.text(`Sucursal: ${receipt.branch.name}`, M, y, { width: CW, align: 'center' });
    y += 11;
    if (receipt.branch.address) {
      doc.text(receipt.branch.address, M, y, { width: CW, align: 'center' });
      y += 11;
    }

    y += 5;
    divider(doc, y);
    y += 7;

    const docTypeTitle = receipt.documentType === 'BOLETA' ? 'BOLETA DE VENTA ELECTRÓNICA'
                       : receipt.documentType === 'FACTURA' ? 'FACTURA DE VENTA ELECTRÓNICA'
                       : 'TICKET DE VENTA';

    doc.fontSize(8).font('Helvetica-Bold').fillColor(dark)
       .text(docTypeTitle, M, y, { width: CW, align: 'center' });
    y += 13;

    const fecha = new Date(receipt.createdAt).toLocaleDateString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
    const hora = new Date(receipt.createdAt).toLocaleTimeString('es-PE', {
      hour: '2-digit', minute: '2-digit',
    });

    const documentNumber = (receipt.series && receipt.correlative)
      ? `${receipt.series}-${String(receipt.correlative).padStart(6, '0')}`
      : `N° Venta: #${receipt.orderId}`;

    doc.fontSize(7).font('Helvetica')
       .text(documentNumber, M, y, { width: CW });
    y += 11;
    doc.text(`Fecha: ${fecha}  ${hora}`, M, y, { width: CW });
    y += 11;
    doc.text(`Doc. Tipo: ${receipt.documentType || 'TICKET'}`, M, y, { width: CW });
    y += 11;
    doc.text(`Estado: ${receipt.status}`, M, y, { width: CW });
    y += 11;
    if (receipt.isCrossBranch && receipt.sourceBranch) {
      doc.fillColor('#B91C1C').font('Helvetica-Bold').fontSize(7)
         .text(`PENDIENTE DE RECOJO EN: ${receipt.sourceBranch.name.toUpperCase()}`, M, y, { width: CW });
      y += 11;
      doc.fillColor(dark).font('Helvetica').fontSize(7);
    }

    y += 5;
    divider(doc, y);
    y += 7;

    // ── Vendedor / Cliente ───────────────────────────────────────────────────────
    if (receipt.seller) {
      doc.fontSize(7).font('Helvetica-Bold').fillColor(dark)
         .text('VENDEDOR:', M, y);
      y += 11;
      doc.font('Helvetica')
         .text(`${receipt.seller.name} ${receipt.seller.lastName || ''}`.trim(), M + 2, y, { width: CW });
      y += 11;
    }

    if (receipt.client) {
      doc.fontSize(7).font('Helvetica-Bold').fillColor(dark)
         .text('CLIENTE:', M, y);
      y += 11;
      doc.font('Helvetica')
         .text(`${receipt.client.name} ${receipt.client.lastName || ''}`.trim(), M + 2, y, { width: CW });
      y += 11;
      if (receipt.client.documentId) {
        doc.text(`${receipt.client.documentType || 'Doc.'}: ${receipt.client.documentId}`, M + 2, y, { width: CW });
        y += 11;
      }
    }

    y += 5;
    divider(doc, y);
    y += 7;

    // ── Ítems ────────────────────────────────────────────────────────────────────
    for (const item of receipt.items) {
      doc.fontSize(7).font('Helvetica-Bold').fillColor(dark)
         .text(item.productName, M, y, { width: CW });
      y += 11;

      doc.font('Helvetica').fillColor(gray)
         .text(`x${item.quantity}  @S/ ${item.unitPrice.toFixed(2)}`, M + 4, y, { width: CW - 60 })
         .text(`S/ ${item.lineTotal.toFixed(2)}`, M, y, { width: CW, align: 'right' });
      y += 11;

      if (item.discountAmount > 0) {
        doc.fillColor('#B91C1C')
           .text(`Desc.: -S/ ${item.discountAmount.toFixed(2)}`, M + 4, y, { width: CW });
        y += 11;
      }

      doc.fillColor(dark);
    }

    y += 3;
    divider(doc, y);
    y += 8;

    // ── Totales ──────────────────────────────────────────────────────────────────
    const igvExempt = receipt.igvExempt;
    const igvAmount = igvExempt ? 0 : Math.round(receipt.subtotal * 0.18 * 100) / 100;

    doc.fontSize(7).font('Helvetica').fillColor(dark);

    if (igvExempt) {
      doc.text('Op. Inafecta:', M, y, { width: CW - 60 })
         .text(`S/ ${receipt.total.toFixed(2)}`, M, y, { width: CW, align: 'right' });
      y += 13;
      doc.fillColor(dark)
         .text('IGV:', M, y, { width: CW - 60 })
         .fillColor('#059669')
         .text('Exonerado', M, y, { width: CW, align: 'right' });
      y += 13;
      doc.fillColor(dark);
    } else {
      doc.text('Op. Gravada:', M, y, { width: CW - 60 })
         .text(`S/ ${receipt.subtotal.toFixed(2)}`, M, y, { width: CW, align: 'right' });
      y += 13;
      doc.text('IGV (18%):', M, y, { width: CW - 60 })
         .text(`S/ ${igvAmount.toFixed(2)}`, M, y, { width: CW, align: 'right' });
      y += 13;
    }

    if (receipt.discountTotal > 0) {
      doc.fillColor('#B91C1C')
         .text('Descuento:', M, y, { width: CW - 60 })
         .text(`-S/ ${receipt.discountTotal.toFixed(2)}`, M, y, { width: CW, align: 'right' });
      y += 13;
      doc.fillColor(dark);
    }

    doc.fontSize(9).font('Helvetica-Bold')
       .text('TOTAL:', M, y, { width: CW - 70 })
       .text(`S/ ${receipt.total.toFixed(2)}`, M, y, { width: CW, align: 'right' });
    y += 16;

    // ── Pagos ────────────────────────────────────────────────────────────────────
    if (receipt.payments.length > 0) {
      divider(doc, y);
      y += 7;
      for (const p of receipt.payments) {
        doc.fontSize(7).font('Helvetica').fillColor(gray)
           .text(`${METHOD_LABELS[p.method] || p.method}:`, M, y, { width: CW - 70 })
           .text(`S/ ${p.amount.toFixed(2)}`, M, y, { width: CW, align: 'right' });
        y += 13;
      }
    }

    // ── Pie ──────────────────────────────────────────────────────────────────────
    y += 4;
    divider(doc, y);
    y += 8;
    doc.fontSize(6.5).font('Helvetica').fillColor(gray);
    if (receipt.isPickup && !receipt.isCrossBranch) {
      doc.text("PARA RECOJO EN TIENDA: Conserve este comprobante. Preséntelo junto con su documento de identidad en la sucursal seleccionada para retirar su pedido. Plazo máximo de recojo: 7 días calendario desde la fecha de emisión.", M, y, { width: CW, align: 'center' });
      y += 11;
    }
    doc.text("¡Gracias por su compra en D'Mendoza!", M, y, { width: CW, align: 'center' });

    doc.end();
    return doc;
  }
}
