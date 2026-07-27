import { INewsletterRepository } from "../../domain/repositories/INewsletterRepository";
import { IExcelReportService } from "../../domain/services/IExcelReportService";

export class ExportNewsletterSubscribersUseCase {
  constructor(
    private newsletterRepository: INewsletterRepository,
    private excelReportService: IExcelReportService
  ) {}

  async execute(format: 'excel' | 'csv'): Promise<NodeJS.ReadableStream> {
    const allActive = await this.newsletterRepository.findAllActive();
    return this.excelReportService.generateNewsletterSubscribersReport(allActive, format);
  }
}
