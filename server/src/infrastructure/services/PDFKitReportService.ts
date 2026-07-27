import PDFDocument from 'pdfkit';
import { IPdfReportService } from '@domain/services/IPdfReportService';

export class PDFKitReportService implements IPdfReportService {
  private drawHeader(doc: PDFKit.PDFDocument, title: string) {
    // Header brand name
    doc.fillColor('#1A1A2E')
       .fontSize(24)
       .text("D'MENDOZA", 50, 45, { align: 'left' });

    doc.fontSize(9)
       .fillColor('#6B6B6B')
       .text("Sistema Integral de Gestión Comercial", 50, 75)
       .text(`Fecha de Impresión: ${new Date().toLocaleString('es-PE')}`, 50, 88);

    doc.fillColor('#1A1A2E')
       .fontSize(14)
       .text(title.toUpperCase(), 300, 45, { align: 'right' });

    // Divider line
    doc.moveTo(50, 110)
       .lineTo(545, 110)
       .strokeColor('#D9D9D2')
       .stroke();
  }

  private drawFooter(doc: PDFKit.PDFDocument, pageNum: number) {
    doc.fontSize(8)
       .fillColor('#aaa')
       .text(`Página ${pageNum}`, 50, 760, { align: 'center' });
  }

  async generateSalesReport(data: any[]): Promise<NodeJS.ReadableStream> {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    let pageNum = 1;

    this.drawHeader(doc, "Reporte de Ventas");

    // Table Header
    doc.fillColor('#1A1A2E')
       .fontSize(9)
       .text("ID", 50, 130, { width: 50 })
       .text("Fecha", 100, 130, { width: 90 })
       .text("Canal", 195, 130, { width: 75 })
       .text("Cliente", 275, 130, { width: 140 })
       .text("Total", 420, 130, { width: 65, align: 'right' })
       .text("Estado", 495, 130, { width: 50, align: 'right' });

    doc.moveTo(50, 145)
       .lineTo(545, 145)
       .strokeColor('#1A1A2E')
       .stroke();

    let currentY = 155;
    let totalSalesSum = 0;

    for (const item of data) {
      if (currentY > 700) {
        this.drawFooter(doc, pageNum);
        doc.addPage();
        pageNum++;
        this.drawHeader(doc, "Reporte de Ventas");
        
        // Redraw headers on new page
        doc.fillColor('#1A1A2E')
           .fontSize(9)
           .text("ID", 50, 130, { width: 50 })
           .text("Fecha", 100, 130, { width: 90 })
           .text("Canal", 195, 130, { width: 75 })
           .text("Cliente", 275, 130, { width: 140 })
           .text("Total", 420, 130, { width: 65, align: 'right' })
           .text("Estado", 495, 130, { width: 50, align: 'right' });

        doc.moveTo(50, 145)
           .lineTo(545, 145)
           .strokeColor('#1A1A2E')
           .stroke();
           
        currentY = 155;
      }

      const clientText = item.clientName || item.clientEmail || '-';
      const formattedDate = new Date(item.createdAt).toLocaleDateString('es-PE') + ' ' + new Date(item.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

      doc.fillColor('#555555')
         .fontSize(8)
         .text(String(item.id), 50, currentY, { width: 50 })
         .text(formattedDate, 100, currentY, { width: 90 })
         .text(item.source, 195, currentY, { width: 75 })
         .text(clientText, 275, currentY, { width: 140, height: 10, ellipsis: true })
         .text(`S/. ${item.total.toFixed(2)}`, 420, currentY, { width: 65, align: 'right' })
         .text(item.status, 495, currentY, { width: 50, align: 'right' });

      totalSalesSum += item.total;
      currentY += 18;
    }

    // Totals section
    if (currentY > 680) {
      this.drawFooter(doc, pageNum);
      doc.addPage();
      pageNum++;
      this.drawHeader(doc, "Reporte de Ventas");
      currentY = 130;
    }

    doc.moveTo(50, currentY + 5)
       .lineTo(545, currentY + 5)
       .strokeColor('#D9D9D2')
       .stroke();

    doc.fillColor('#1A1A2E')
       .fontSize(10)
       .text("Total Acumulado:", 300, currentY + 15, { width: 120, align: 'right' })
       .text(`S/. ${totalSalesSum.toFixed(2)}`, 420, currentY + 15, { width: 125, align: 'right' });

    this.drawFooter(doc, pageNum);
    doc.end();

    return doc;
  }

  async generateInventoryReport(data: any[]): Promise<NodeJS.ReadableStream> {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    let pageNum = 1;

    this.drawHeader(doc, "Reporte de Inventario");

    // Table Header
    doc.fillColor('#1A1A2E')
       .fontSize(9)
       .text("ID Var", 50, 130, { width: 50 })
       .text("SKU", 100, 130, { width: 100 })
       .text("Producto", 210, 130, { width: 170 })
       .text("Sucursal", 390, 130, { width: 90 })
       .text("Cantidad", 490, 130, { width: 55, align: 'right' });

    doc.moveTo(50, 145)
       .lineTo(545, 145)
       .strokeColor('#1A1A2E')
       .stroke();

    let currentY = 155;

    for (const item of data) {
      if (currentY > 700) {
        this.drawFooter(doc, pageNum);
        doc.addPage();
        pageNum++;
        this.drawHeader(doc, "Reporte de Inventario");
        
        doc.fillColor('#1A1A2E')
           .fontSize(9)
           .text("ID Var", 50, 130, { width: 50 })
           .text("SKU", 100, 130, { width: 100 })
           .text("Producto", 210, 130, { width: 170 })
           .text("Sucursal", 390, 130, { width: 90 })
           .text("Cantidad", 490, 130, { width: 55, align: 'right' });

        doc.moveTo(50, 145)
           .lineTo(545, 145)
           .strokeColor('#1A1A2E')
           .stroke();
           
        currentY = 155;
      }

      doc.fillColor('#555555')
         .fontSize(8)
         .text(String(item.variantId), 50, currentY, { width: 50 })
         .text(item.sku, 100, currentY, { width: 100 })
         .text(item.productName, 210, currentY, { width: 170, height: 10, ellipsis: true })
         .text(item.branchName, 390, currentY, { width: 90, height: 10, ellipsis: true })
         .text(item.quantity.toString(), 490, currentY, { width: 55, align: 'right' });

      currentY += 18;
    }

    this.drawFooter(doc, pageNum);
    doc.end();

    return doc;
  }

  async generateClientsReport(data: any[]): Promise<NodeJS.ReadableStream> {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    let pageNum = 1;

    this.drawHeader(doc, "Reporte de Clientes");

    // Table Header
    doc.fillColor('#1A1A2E')
       .fontSize(9)
       .text("ID", 50, 130, { width: 40 })
       .text("Nombre Completo", 95, 130, { width: 150 })
       .text("Email", 250, 130, { width: 145 })
       .text("Documento", 400, 130, { width: 90 })
       .text("Cuenta", 495, 130, { width: 50, align: 'right' });

    doc.moveTo(50, 145)
       .lineTo(545, 145)
       .strokeColor('#1A1A2E')
       .stroke();

    let currentY = 155;

    for (const item of data) {
      if (currentY > 700) {
        this.drawFooter(doc, pageNum);
        doc.addPage();
        pageNum++;
        this.drawHeader(doc, "Reporte de Clientes");
        
        doc.fillColor('#1A1A2E')
           .fontSize(9)
           .text("ID", 50, 130, { width: 40 })
           .text("Nombre Completo", 95, 130, { width: 150 })
           .text("Email", 250, 130, { width: 145 })
           .text("Documento", 400, 130, { width: 90 })
           .text("Cuenta", 495, 130, { width: 50, align: 'right' });

        doc.moveTo(50, 145)
           .lineTo(545, 145)
           .strokeColor('#1A1A2E')
           .stroke();
           
        currentY = 155;
      }

      const fullName = `${item.name} ${item.lastName || ''}`;
      const docText = item.documentType ? `${item.documentType}: ${item.documentId || '-'}` : '-';
      const statusText = item.user ? (item.user.isActive ? 'Activa' : 'Inactiva') : 'POS';

      doc.fillColor('#555555')
         .fontSize(8)
         .text(String(item.id), 50, currentY, { width: 40 })
         .text(fullName, 95, currentY, { width: 150, height: 10, ellipsis: true })
         .text(item.email || '-', 250, currentY, { width: 145, height: 10, ellipsis: true })
         .text(docText, 400, currentY, { width: 90, height: 10, ellipsis: true })
         .text(statusText, 495, currentY, { width: 50, align: 'right' });

      currentY += 18;
    }

    this.drawFooter(doc, pageNum);
    doc.end();

    return doc;
  }
}
