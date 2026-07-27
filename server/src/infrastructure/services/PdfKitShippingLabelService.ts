import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { IShippingLabelService, ShippingLabelData } from '@domain/services/IShippingLabelService';

export class PdfKitShippingLabelService implements IShippingLabelService {
  async generateLabelPdfStream(data: ShippingLabelData): Promise<NodeJS.ReadableStream> {
    // Standard A6 size is perfect for shipping labels (105 x 148 mm)
    const doc = new PDFDocument({ margin: 20, size: 'A6' });

    // Outer border to simulate a real label
    doc.rect(10, 10, 278, 399).strokeColor('#3F3F3F').lineWidth(2).stroke();

    // Header
    doc.fillColor('#3F3F3F')
       .fontSize(16)
       .text("E-Commerce", 20, 20, { align: 'center' });
       
    doc.fontSize(8)
       .fillColor('#6B6B6B')
       .text("DESPACHO / LOGÍSTICA", 20, 38, { align: 'center' });

    // Horizontal line
    doc.moveTo(10, 50).lineTo(288, 50).strokeColor('#3F3F3F').lineWidth(1).stroke();

    // Tracking Code Section
    doc.fontSize(8)
       .fillColor('#6B6B6B')
       .text("CÓDIGO DE ENVÍO", 20, 60);

    doc.fontSize(14)
       .fillColor('#3F3F3F')
       .text(data.trackingCode, 20, 72, { align: 'left' });

    // Draw QR code
    try {
      // Create a tracking URL or just use the tracking code if no URL is provided
      const trackingUrl = `https://e-commerce.com/track/${data.trackingCode}`;
      const qrBuffer = await QRCode.toBuffer(trackingUrl, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 80,
      });
      
      // Place the QR code on the right side of the label
      doc.image(qrBuffer, 200, 55, { width: 80 });
    } catch (err) {
      console.error('Error generating QR code for shipping label:', err);
    }

    // Horizontal line
    doc.moveTo(10, 145).lineTo(288, 145).strokeColor('#3F3F3F').lineWidth(1).stroke();

    // Recipient Details
    doc.fontSize(8)
       .fillColor('#6B6B6B')
       .text("DESTINATARIO", 20, 155);

    doc.fontSize(11)
       .fillColor('#3F3F3F')
       .text(data.recipientName, 20, 167);

    // Horizontal line
    doc.moveTo(10, 195).lineTo(288, 195).strokeColor('#3F3F3F').lineWidth(1).stroke();

    // Address Details
    doc.fontSize(8)
       .fillColor('#6B6B6B')
       .text("DIRECCIÓN DE ENTREGA", 20, 205);

    doc.fontSize(9)
       .fillColor('#3F3F3F')
       .text(data.fullAddress, 20, 217, { width: 250 });

    // Horizontal line
    doc.moveTo(10, 290).lineTo(288, 290).strokeColor('#3F3F3F').lineWidth(1).stroke();

    // District Details
    doc.fontSize(8)
       .fillColor('#6B6B6B')
       .text("DISTRITO / ZONA", 20, 300);

    doc.fontSize(12)
       .fillColor('#3F3F3F')
       .text(data.district.toUpperCase(), 20, 312);

    // Footer note
    doc.fontSize(6)
       .fillColor('#6B6B6B')
       .text("Por favor, verifique el contenido del paquete antes de firmar la entrega.", 20, 380, { align: 'center', width: 250 });

    doc.end();
    return doc;
  }
}
