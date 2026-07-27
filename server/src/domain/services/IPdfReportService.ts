export interface IPdfReportService {
  generateSalesReport(data: any[]): Promise<NodeJS.ReadableStream>;
  generateInventoryReport(data: any[]): Promise<NodeJS.ReadableStream>;
  generateClientsReport(data: any[]): Promise<NodeJS.ReadableStream>;
}
