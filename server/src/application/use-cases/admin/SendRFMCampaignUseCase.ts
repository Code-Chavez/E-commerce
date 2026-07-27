import { ResendEmailService } from '@infrastructure/services/ResendEmailService';
import { GetRFMSegmentsUseCase, RFMSegment } from './GetRFMSegmentsUseCase';

export class SendRFMCampaignUseCase {
  private emailService = new ResendEmailService();
  private rfmUseCase = new GetRFMSegmentsUseCase();

  async execute(
    segment: RFMSegment,
    subject: string,
    body: string,
  ): Promise<{ sent: number; failed: number; total: number }> {
    const { clients } = await this.rfmUseCase.execute(segment);

    let sent = 0;
    let failed = 0;

    for (const client of clients) {
      if (!client.email) {
        failed++;
        continue;
      }
      try {
        const html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <p style="font-size: 15px; color: #1a1a1a; line-height: 1.6;">${body.replace(/\n/g, '<br>')}</p>
            <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />
            <p style="font-size: 12px; color: #6b7280;">Este mensaje fue enviado a ${client.email}</p>
          </div>`;
        await this.emailService.sendEmail(client.email, subject, html);
        sent++;
      } catch {
        failed++;
      }
    }

    return { sent, failed, total: clients.length };
  }
}
