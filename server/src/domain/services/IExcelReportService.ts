export interface IExcelReportService {
  generateSalesReport(
    data: any[],
    format: 'excel' | 'csv'
  ): Promise<NodeJS.ReadableStream>;
  generateInventoryReport(
    data: any[],
    format: 'excel' | 'csv'
  ): Promise<NodeJS.ReadableStream>;
  generateClientsReport(
    data: any[],
    format: 'excel' | 'csv'
  ): Promise<NodeJS.ReadableStream>;
  generateNewsletterSubscribersReport(
    data: any[],
    format: 'excel' | 'csv'
  ): Promise<NodeJS.ReadableStream>;
}
