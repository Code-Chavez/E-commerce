import { IPdfGenerator } from '@domain/ports/IPdfGenerator';
import PDFDocument from 'pdfkit';

export class PdfGeneratorAdapter implements IPdfGenerator {
  async generateCreditNotePdf(data: {
    creditNoteCode: string;
    amount: number;
    type: string;
    clientName: string;
    clientEmail: string;
    items: Array<{ name: string; qty: number; unitPrice: number }>;
    createdAt: Date;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err) => reject(err));

        // Logo / Title
        doc.fillColor('#3F3F3F')
           .fontSize(24)
           .text("D'MENDOZA", 50, 50, { align: 'left' });

        doc.fontSize(10)
           .fillColor('#6B6B6B')
           .text("Tienda Online de Moda D'Mendoza S.A.C.", 50, 80)
           .text("RUC: 20609876543", 50, 95)
           .text("Lima, Perú", 50, 110);

        // Document Details
        const isStoreCredit = data.type === 'STORE_CREDIT';
        const docTitle = isStoreCredit ? 'VALE DE CRÉDITO' : 'NOTA DE CRÉDITO';

        doc.fillColor('#3F3F3F')
           .fontSize(14)
           .text(docTitle, 300, 50, { align: 'right' });

        const formattedDate = data.createdAt instanceof Date
          ? data.createdAt.toLocaleDateString('es-PE')
          : new Date(data.createdAt).toLocaleDateString('es-PE');

        doc.fontSize(10)
           .fillColor('#6B6B6B')
           .text(`Código: ${data.creditNoteCode}`, 300, 75, { align: 'right' })
           .text(`Fecha Emisión: ${formattedDate}`, 300, 90, { align: 'right' })
           .text(`Estado: DISPONIBLE`, 300, 105, { align: 'right' });

        // Divider
        doc.moveTo(50, 135)
           .lineTo(545, 135)
           .strokeColor('#D9D9D2')
           .stroke();

        // Customer Details
        doc.fillColor('#3F3F3F')
           .fontSize(11)
           .text("DETALLES DEL CLIENTE", 50, 155);

        doc.fontSize(10)
           .fillColor('#6B6B6B')
           .text(`Nombre: ${data.clientName}`, 50, 175)
           .text(`Email: ${data.clientEmail}`, 50, 190);

        // Usage Note
        doc.fillColor('#3F3F3F')
           .fontSize(11)
           .text("TÉRMINOS DE USO", 300, 155);

        const termsText = isStoreCredit
          ? "Este vale de crédito puede ser utilizado como saldo a favor en su próxima compra en nuestra tienda online."
          : "Esta nota de crédito respalda la devolución de los productos detallados a continuación.";

        doc.fontSize(10)
           .fillColor('#6B6B6B')
           .text(termsText, 300, 175, { width: 245 });

        // Table Header Divider
        doc.moveTo(50, 245)
           .lineTo(545, 245)
           .strokeColor('#D9D9D2')
           .stroke();

        // Table Headers
        doc.fillColor('#3F3F3F')
           .fontSize(10)
           .text("Producto / Detalle", 50, 255, { width: 260 })
           .text("Cant.", 320, 255, { width: 50, align: 'right' })
           .text("P. Unit.", 380, 255, { width: 70, align: 'right' })
           .text("Total", 465, 255, { width: 80, align: 'right' });

        // Table Header Bottom Line
        doc.moveTo(50, 270)
           .lineTo(545, 270)
           .strokeColor('#3F3F3F')
           .stroke();

        let currentY = 280;
        for (const item of data.items) {
          const qty = item.qty;
          const price = item.unitPrice;
          const total = qty * price;

          doc.fillColor('#6B6B6B')
             .text(item.name, 50, currentY, { width: 260 })
             .text(qty.toString(), 320, currentY, { width: 50, align: 'right' })
             .text(`S/. ${price.toFixed(2)}`, 380, currentY, { width: 70, align: 'right' })
             .text(`S/. ${total.toFixed(2)}`, 465, currentY, { width: 80, align: 'right' });

          currentY += 20;

          if (currentY > 700) {
            doc.addPage();
            currentY = 50;
          }
        }

        // Table Footer Divider
        doc.moveTo(50, currentY + 10)
           .lineTo(545, currentY + 10)
           .strokeColor('#D9D9D2')
           .stroke();

        currentY += 25;

        // Total
        doc.fontSize(12)
           .fillColor('#3F3F3F')
           .text("Monto Total:", 320, currentY, { width: 130, align: 'right' })
           .text(`S/. ${data.amount.toFixed(2)}`, 465, currentY, { width: 80, align: 'right' });

        // Fixed footer
        doc.fontSize(9)
           .fillColor('#6B6B6B')
           .text("¡Gracias por su preferencia!", 50, 750, { align: 'center' })
           .text("Este es un comprobante digital emitido por D'Mendoza.", 50, 765, { align: 'center' });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
