import ExcelJS from 'exceljs';
import { PassThrough } from 'stream';
import { IExcelReportService } from '@domain/services/IExcelReportService';

export class ExcelReportService implements IExcelReportService {
  async generateSalesReport(
    data: any[],
    format: 'excel' | 'csv'
  ): Promise<NodeJS.ReadableStream> {
    const passThrough = new PassThrough();

    if (format === 'csv') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Ventas');

      sheet.columns = [
        { header: 'ID Venta', key: 'id', width: 12 },
        { header: 'Fecha', key: 'createdAt', width: 20 },
        { header: 'Canal', key: 'source', width: 15 },
        { header: 'Cliente', key: 'client', width: 30 },
        { header: 'Subtotal', key: 'subtotal', width: 15 },
        { header: 'Descuento', key: 'discount', width: 15 },
        { header: 'Envio', key: 'shipping', width: 15 },
        { header: 'Total', key: 'total', width: 15 },
        { header: 'Estado', key: 'status', width: 15 },
      ];

      for (const item of data) {
        sheet.addRow({
          id: item.id,
          createdAt: new Date(item.createdAt)
            .toISOString()
            .replace('T', ' ')
            .substring(0, 19),
          source: item.source,
          client: item.clientName || item.clientEmail || '-',
          subtotal: item.subtotal.toFixed(2),
          discount: item.discount.toFixed(2),
          shipping: item.shipping.toFixed(2),
          total: item.total.toFixed(2),
          status: item.status,
        });
      }

      workbook.csv
        .write(passThrough)
        .catch((err: any) => passThrough.destroy(err));

      return passThrough;
    } else {
      const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
        stream: passThrough,
      });
      const sheet = workbook.addWorksheet('Ventas');

      sheet.columns = [
        { header: 'ID Venta', key: 'id', width: 12 },
        { header: 'Fecha', key: 'createdAt', width: 22 },
        { header: 'Canal', key: 'source', width: 15 },
        { header: 'Cliente', key: 'client', width: 30 },
        {
          header: 'Subtotal (S/.)',
          key: 'subtotal',
          width: 15,
          style: { numFmt: '"S/." #,##0.00' },
        },
        {
          header: 'Descuento (S/.)',
          key: 'discount',
          width: 15,
          style: { numFmt: '"S/." #,##0.00' },
        },
        {
          header: 'Envío (S/.)',
          key: 'shipping',
          width: 15,
          style: { numFmt: '"S/." #,##0.00' },
        },
        {
          header: 'Total (S/.)',
          key: 'total',
          width: 15,
          style: { numFmt: '"S/." #,##0.00' },
        },
        { header: 'Estado', key: 'status', width: 15 },
      ];

      // Style header row
      const headerRow = sheet.getRow(1);
      headerRow.font = {
        name: 'Arial',
        size: 11,
        bold: true,
        color: { argb: 'FFFFFFFF' },
      };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1A1A2E' }, // Dark premium navy
      };
      headerRow.commit();

      for (const item of data) {
        const row = sheet.addRow({
          id: item.id,
          createdAt: new Date(item.createdAt)
            .toISOString()
            .replace('T', ' ')
            .substring(0, 19),
          source: item.source,
          client: item.clientName || item.clientEmail || '-',
          subtotal: item.subtotal,
          discount: item.discount,
          shipping: item.shipping,
          total: item.total,
          status: item.status,
        });
        row.commit();
      }

      workbook.commit().catch((err: any) => passThrough.destroy(err));

      return passThrough;
    }
  }

  async generateInventoryReport(
    data: any[],
    format: 'excel' | 'csv'
  ): Promise<NodeJS.ReadableStream> {
    const passThrough = new PassThrough();

    if (format === 'csv') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Inventario');

      sheet.columns = [
        { header: 'ID Variante', key: 'variantId', width: 15 },
        { header: 'SKU', key: 'sku', width: 20 },
        { header: 'Producto', key: 'productName', width: 35 },
        { header: 'Sucursal', key: 'branchName', width: 20 },
        { header: 'Cantidad', key: 'quantity', width: 12 },
        { header: 'Estado Stock', key: 'status', width: 15 },
      ];

      for (const item of data) {
        sheet.addRow({
          variantId: item.variantId,
          sku: item.sku,
          productName: item.productName,
          branchName: item.branchName,
          quantity: item.quantity,
          status: item.status,
        });
      }

      workbook.csv
        .write(passThrough)
        .catch((err: any) => passThrough.destroy(err));

      return passThrough;
    } else {
      const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
        stream: passThrough,
      });
      const sheet = workbook.addWorksheet('Inventario');

      sheet.columns = [
        { header: 'ID Variante', key: 'variantId', width: 15 },
        { header: 'SKU', key: 'sku', width: 20 },
        { header: 'Producto', key: 'productName', width: 35 },
        { header: 'Sucursal', key: 'branchName', width: 20 },
        {
          header: 'Cantidad',
          key: 'quantity',
          width: 12,
          style: { numFmt: '#,##0' },
        },
        { header: 'Estado Stock', key: 'status', width: 15 },
      ];

      const headerRow = sheet.getRow(1);
      headerRow.font = {
        name: 'Arial',
        size: 11,
        bold: true,
        color: { argb: 'FFFFFFFF' },
      };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1A1A2E' },
      };
      headerRow.commit();

      for (const item of data) {
        const row = sheet.addRow({
          variantId: item.variantId,
          sku: item.sku,
          productName: item.productName,
          branchName: item.branchName,
          quantity: item.quantity,
          status: item.status,
        });
        row.commit();
      }

      workbook.commit().catch((err: any) => passThrough.destroy(err));

      return passThrough;
    }
  }

  async generateClientsReport(
    data: any[],
    format: 'excel' | 'csv'
  ): Promise<NodeJS.ReadableStream> {
    const passThrough = new PassThrough();

    if (format === 'csv') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Clientes');

      sheet.columns = [
        { header: 'ID Cliente', key: 'id', width: 12 },
        { header: 'Nombre', key: 'name', width: 20 },
        { header: 'Apellido', key: 'lastName', width: 20 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Teléfono', key: 'phone', width: 15 },
        { header: 'Tipo Doc', key: 'documentType', width: 12 },
        { header: 'Nro Doc', key: 'documentId', width: 15 },
        { header: 'Dirección', key: 'address', width: 35 },
        { header: 'Distrito', key: 'district', width: 20 },
        { header: 'Cuenta Activa', key: 'isActive', width: 15 },
        { header: 'Creado El', key: 'createdAt', width: 20 },
      ];

      for (const item of data) {
        sheet.addRow({
          id: item.id,
          name: item.name,
          lastName: item.lastName || '-',
          email: item.email || '-',
          phone: item.phone || '-',
          documentType: item.documentType || '-',
          documentId: item.documentId || '-',
          address: item.address || '-',
          district: item.district || '-',
          isActive: item.user ? (item.user.isActive ? 'SI' : 'NO') : 'POS ONLY',
          createdAt: new Date(item.createdAt)
            .toISOString()
            .replace('T', ' ')
            .substring(0, 10),
        });
      }

      workbook.csv
        .write(passThrough)
        .catch((err: any) => passThrough.destroy(err));

      return passThrough;
    } else {
      const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
        stream: passThrough,
      });
      const sheet = workbook.addWorksheet('Clientes');

      sheet.columns = [
        { header: 'ID Cliente', key: 'id', width: 12 },
        { header: 'Nombre', key: 'name', width: 20 },
        { header: 'Apellido', key: 'lastName', width: 20 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Teléfono', key: 'phone', width: 15 },
        { header: 'Tipo Doc', key: 'documentType', width: 12 },
        { header: 'Nro Doc', key: 'documentId', width: 15 },
        { header: 'Dirección', key: 'address', width: 35 },
        { header: 'Distrito', key: 'district', width: 20 },
        { header: 'Cuenta Activa', key: 'isActive', width: 15 },
        { header: 'Creado El', key: 'createdAt', width: 20 },
      ];

      const headerRow = sheet.getRow(1);
      headerRow.font = {
        name: 'Arial',
        size: 11,
        bold: true,
        color: { argb: 'FFFFFFFF' },
      };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1A1A2E' },
      };
      headerRow.commit();

      for (const item of data) {
        const row = sheet.addRow({
          id: item.id,
          name: item.name,
          lastName: item.lastName || '-',
          email: item.email || '-',
          phone: item.phone || '-',
          documentType: item.documentType || '-',
          documentId: item.documentId || '-',
          address: item.address || '-',
          district: item.district || '-',
          isActive: item.user ? (item.user.isActive ? 'SI' : 'NO') : 'POS ONLY',
          createdAt: new Date(item.createdAt)
            .toISOString()
            .replace('T', ' ')
            .substring(0, 10),
        });
        row.commit();
      }

      workbook.commit().catch((err: any) => passThrough.destroy(err));

      return passThrough;
    }
  }

  async generateNewsletterSubscribersReport(
    data: any[],
    format: 'excel' | 'csv'
  ): Promise<NodeJS.ReadableStream> {
    const passThrough = new PassThrough();

    if (format === 'csv') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Suscriptores');

      sheet.columns = [
        { header: 'ID', key: 'id', width: 12 },
        { header: 'Email', key: 'email', width: 35 },
        { header: 'Activo', key: 'isActive', width: 15 },
        { header: 'Suscrito El', key: 'subscribedAt', width: 20 },
      ];

      for (const item of data) {
        sheet.addRow({
          id: item.id,
          email: item.email,
          isActive: item.isActive ? 'SI' : 'NO',
          subscribedAt: new Date(item.subscribedAt)
            .toISOString()
            .replace('T', ' ')
            .substring(0, 10),
        });
      }

      workbook.csv
        .write(passThrough)
        .catch((err: any) => passThrough.destroy(err));

      return passThrough;
    } else {
      const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
        stream: passThrough,
      });
      const sheet = workbook.addWorksheet('Suscriptores');

      sheet.columns = [
        { header: 'ID', key: 'id', width: 12 },
        { header: 'Email', key: 'email', width: 35 },
        { header: 'Activo', key: 'isActive', width: 15 },
        { header: 'Suscrito El', key: 'subscribedAt', width: 20 },
      ];

      const headerRow = sheet.getRow(1);
      headerRow.font = {
        name: 'Arial',
        size: 11,
        bold: true,
        color: { argb: 'FFFFFFFF' },
      };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1A1A2E' },
      };
      headerRow.commit();

      for (const item of data) {
        const row = sheet.addRow({
          id: item.id,
          email: item.email,
          isActive: item.isActive ? 'SI' : 'NO',
          subscribedAt: new Date(item.subscribedAt)
            .toISOString()
            .replace('T', ' ')
            .substring(0, 10),
        });
        row.commit();
      }

      workbook.commit().catch((err: any) => passThrough.destroy(err));

      return passThrough;
    }
  }
}
