import PDFDocument from 'pdfkit';
import { IReceiptPdfService } from '@domain/services/IReceiptPdfService';
import { Order } from '@domain/entities/Order';
import { User } from '@domain/entities/User';

export class PDFKitReceiptPdfService implements IReceiptPdfService {
  async generateReceiptPdfStream(order: Order, user: User): Promise<NodeJS.ReadableStream> {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Cabecera - Nombre de la marca y datos fiscales de la tienda
    doc.fillColor('#3F3F3F')
       .fontSize(24)
       .text("D'MENDOZA", 50, 50, { align: 'left' });

    doc.fontSize(10)
       .fillColor('#6B6B6B')
       .text("Tienda Online de Moda D'Mendoza S.A.C.", 50, 80)
       .text("RUC: 20609876543", 50, 95)
       .text("Lima, Perú", 50, 110);

    // Cabecera - Título del Comprobante e Información del Pedido (lado derecho)
    doc.fillColor('#3F3F3F')
       .fontSize(14)
       .text("COMPROBANTE DE COMPRA", 300, 50, { align: 'right' });
    
    const formattedDate = order.createdAt instanceof Date
      ? order.createdAt.toLocaleDateString('es-PE')
      : new Date(order.createdAt).toLocaleDateString('es-PE');

    doc.fontSize(10)
       .fillColor('#6B6B6B')
       .text(`Pedido N°: #${order.id}`, 300, 75, { align: 'right' })
       .text(`Fecha: ${formattedDate}`, 300, 90, { align: 'right' })
       .text(`Estado: PAGADO (PAID)`, 300, 105, { align: 'right' });

    // Dibujar línea divisora horizontal
    doc.moveTo(50, 135)
       .lineTo(545, 135)
       .strokeColor('#D9D9D2')
       .stroke();

    // Sección: Información del Cliente
    doc.fillColor('#3F3F3F')
       .fontSize(11)
       .text("DETALLES DEL CLIENTE", 50, 155);

    doc.fontSize(10)
       .fillColor('#6B6B6B')
       .text(`Nombre: ${user.name || ''} ${user.lastName || ''}`, 50, 175)
       .text(`Email: ${user.email}`, 50, 190)
       .text(`Teléfono: ${user.phone || '-'}`, 50, 205);

    // Sección: Información de Envío
    const address = order.addressSnapshot;
    doc.fillColor('#3F3F3F')
       .fontSize(11)
       .text("DIRECCIÓN DE ENVÍO", 300, 155);

    doc.fontSize(10)
       .fillColor('#6B6B6B')
       .text(`Alias: ${address?.alias || 'Principal'}`, 300, 175)
       .text(`Dirección: ${address?.fullAddress || ''}`, 300, 190)
       .text(`Distrito: ${address?.district || ''}`, 300, 205)
       .text(`Referencia: ${address?.reference || '-'}`, 300, 220);

    // Dibujar línea divisora de cabecera de tabla
    doc.moveTo(50, 250)
       .lineTo(545, 250)
       .strokeColor('#D9D9D2')
       .stroke();

    // Encabezados de la Tabla
    doc.fillColor('#3F3F3F')
       .fontSize(10)
       .text("Producto", 50, 260, { width: 180 })
       .text("SKU", 240, 260, { width: 100 })
       .text("Cant.", 350, 260, { width: 40, align: 'right' })
       .text("P. Unit.", 400, 260, { width: 60, align: 'right' })
       .text("Total", 475, 260, { width: 70, align: 'right' });

    // Separador de Encabezados
    doc.moveTo(50, 275)
       .lineTo(545, 275)
       .strokeColor('#3F3F3F')
       .stroke();

    let currentY = 285;
    const items = order.items || [];

    for (const item of items) {
      const pName = item.productName || "Variante de Producto";
      const sku = item.variantSku || "N/A";
      const qty = item.qty;
      const price = Number(item.unitPrice);
      const subtotal = qty * price;

      doc.fillColor('#6B6B6B')
         .text(pName, 50, currentY, { width: 180 })
         .text(sku, 240, currentY, { width: 100 })
         .text(qty.toString(), 350, currentY, { width: 40, align: 'right' })
         .text(`S/. ${price.toFixed(2)}`, 400, currentY, { width: 60, align: 'right' })
         .text(`S/. ${subtotal.toFixed(2)}`, 475, currentY, { width: 70, align: 'right' });

      currentY += 20;

      // Control de salto de página si excede el tamaño útil
      if (currentY > 720) {
        doc.addPage();
        currentY = 50;
      }
    }

    // Dibujar línea de cierre de tabla
    doc.moveTo(50, currentY + 10)
       .lineTo(545, currentY + 10)
       .strokeColor('#D9D9D2')
       .stroke();

    currentY += 25;

    // Bloque de Totales desglosados
    const total = Number(order.total);
    const shipping = Number(order.shippingCost);
    const subtotal = total - shipping;

    doc.fillColor('#3F3F3F')
       .text("Subtotal:", 350, currentY, { width: 110, align: 'right' })
       .text(`S/. ${subtotal.toFixed(2)}`, 475, currentY, { width: 70, align: 'right' });

    doc.text("Envío (Delivery):", 350, currentY + 15, { width: 110, align: 'right' })
       .text(`S/. ${shipping.toFixed(2)}`, 475, currentY + 15, { width: 70, align: 'right' });

    doc.fontSize(11)
       .fillColor('#3F3F3F')
       .text("Total:", 350, currentY + 35, { width: 110, align: 'right' })
       .text(`S/. ${total.toFixed(2)}`, 475, currentY + 35, { width: 70, align: 'right' });

    // Mensaje de pie de página fijo
    doc.fontSize(9)
       .fillColor('#6B6B6B')
       .text("¡Gracias por comprar en D'Mendoza!", 50, 750, { align: 'center' })
       .text("Este documento es un comprobante digital de compra y no tiene valor tributario.", 50, 765, { align: 'center' });

    doc.end();

    return doc;
  }
}
