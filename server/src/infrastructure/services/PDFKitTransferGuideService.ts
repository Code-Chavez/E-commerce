import PDFDocument from 'pdfkit';
import { IStockTransferGuideService, TransferGuideData } from '@domain/services/IStockTransferGuideService';

export class PDFKitTransferGuideService implements IStockTransferGuideService {
  generate(data: TransferGuideData): NodeJS.ReadableStream {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    const gray = '#6B6B6B';
    const dark = '#3F3F3F';
    const divider = '#D9D9D2';

    // ── Cabecera: marca ────────────────────────────────────────────────────────
    doc.fillColor(dark).fontSize(24).text("E-Commerce", 50, 50, { align: 'left' });
    doc.fontSize(10).fillColor(gray)
       .text("E-Commerce S.A.C.", 50, 80)
       .text('RUC: 20609876543', 50, 95)
       .text('Almacén Central', 50, 110);

    // ── Cabecera: datos del comprobante ────────────────────────────────────────
    doc.fillColor(dark).fontSize(14)
       .text('GUÍA DE TRANSFERENCIA INTERNA', 250, 50, { align: 'right' });

    const fecha = data.createdAt instanceof Date
      ? data.createdAt.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : new Date(data.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const hora = data.createdAt instanceof Date
      ? data.createdAt.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
      : new Date(data.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

    doc.fontSize(10).fillColor(gray)
       .text(`Guía N°: ${data.guideNumber}`, 300, 75, { align: 'right' })
       .text(`Fecha: ${fecha}  ${hora}`, 300, 90, { align: 'right' })
       .text(`Estado: ${data.status}`, 300, 105, { align: 'right' });

    // ── Línea divisora ─────────────────────────────────────────────────────────
    doc.moveTo(50, 130).lineTo(545, 130).strokeColor(divider).stroke();

    // ── Sedes y Responsable ─────────────────────────────────────────────────────
    let infoY = 145;

    // Origen
    doc.fillColor(dark).fontSize(11).text('SUCURSAL ORIGEN', 50, infoY);
    doc.fontSize(10).fillColor(gray)
       .text(data.fromBranch.name, 50, infoY + 16)
       .text(data.fromBranch.address || '—', 50, infoY + 31);

    // Destino
    doc.fillColor(dark).fontSize(11).text('SUCURSAL DESTINO', 250, infoY);
    doc.fontSize(10).fillColor(gray)
       .text(data.toBranch.name, 250, infoY + 16)
       .text(data.toBranch.address || '—', 250, infoY + 31);

    // Responsable
    if (data.requestedBy) {
      doc.fillColor(dark).fontSize(11).text('RESPONSABLE', 420, infoY);
      doc.fontSize(10).fillColor(gray)
         .text(`${data.requestedBy.name} ${data.requestedBy.lastName || ''}`.trim(), 420, infoY + 16);
    }

    // ── Línea divisora ─────────────────────────────────────────────────────────
    const tableStart = infoY + 60;
    doc.moveTo(50, tableStart).lineTo(545, tableStart).strokeColor(divider).stroke();

    // ── Encabezado tabla de ítems ──────────────────────────────────────────────
    const headerY = tableStart + 12;
    doc.fillColor(dark).fontSize(10)
       .text('Código SKU', 50, headerY, { width: 100 })
       .text('Producto', 160, headerY, { width: 280 })
       .text('Cantidad', 450, headerY, { width: 95, align: 'right' });

    doc.moveTo(50, headerY + 15).lineTo(545, headerY + 15).strokeColor(dark).stroke();

    // ── Ítems ──────────────────────────────────────────────────────────────────
    let y = headerY + 25;

    // En este caso solo hay 1 ítem por transferencia según el modelo actual
    doc.fillColor(gray).fontSize(10)
       .text(data.variant.sku, 50, y, { width: 100 })
       .text(data.variant.productName, 160, y, { width: 280 })
       .text(data.quantity.toString(), 450, y, { width: 95, align: 'right' });

    y += 20;

    // ── Línea cierre tabla ─────────────────────────────────────────────────────
    doc.moveTo(50, y + 6).lineTo(545, y + 6).strokeColor(divider).stroke();
    
    // ── Firmas ─────────────────────────────────────────────────────────────────
    const firmY = 650;
    
    doc.moveTo(80, firmY).lineTo(220, firmY).strokeColor(dark).stroke();
    doc.fillColor(dark).fontSize(10).text('Firma Entrega (Origen)', 80, firmY + 10, { width: 140, align: 'center' });

    doc.moveTo(375, firmY).lineTo(515, firmY).strokeColor(dark).stroke();
    doc.fillColor(dark).fontSize(10).text('Firma Recepción (Destino)', 375, firmY + 10, { width: 140, align: 'center' });

    // ── Pie de página ──────────────────────────────────────────────────────────
    doc.fontSize(8).fillColor(gray)
       .text('Documento generado automáticamente por el Sistema de Inventario.', 50, 772, { align: 'center', width: 495 });

    doc.end();
    return doc;
  }
}
