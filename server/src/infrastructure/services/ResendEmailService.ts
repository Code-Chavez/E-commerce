import { Resend } from 'resend';
import { IEmailService } from '@domain/services/IEmailService';
import { PrismaCommunicationLogRepository } from '../database/repositories/PrismaCommunicationLogRepository';
import { prisma } from '../database/prisma';
import { CommunicationChannel } from '@domain/entities/CommunicationLog';

class BaseResendEmailService implements IEmailService {
  private resend: Resend | null;
  private readonly defaultFrom = process.env.RESEND_FROM_EMAIL || 'E-Commerce <noreply@e-commerce.shop>';

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey && apiKey !== 're_1234567890_placeholder') {
      this.resend = new Resend(apiKey);
    } else {
      this.resend = null;
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (!this.resend) {
      console.log('--- SIMULACIÓN DE ENVÍO DE EMAIL ---');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body HTML:\n${html}`);
      console.log('------------------------------------');
      return;
    }

    try {
      const { error } = await this.resend.emails.send({
        from: this.defaultFrom,
        to,
        subject,
        html,
      });

      if (error) {
        console.error('Error sending email with Resend:', error);
        throw new Error(`Error sending email: ${error.message}`);
      }
    } catch (error) {
      console.error('Unexpected error in ResendEmailService:', error);
      throw error;
    }
  }
}

export class ResendEmailService implements IEmailService {
  private baseService: BaseResendEmailService;
  private logRepo: PrismaCommunicationLogRepository;

  constructor() {
    this.baseService = new BaseResendEmailService();
    this.logRepo = new PrismaCommunicationLogRepository();
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    await this.baseService.sendEmail(to, subject, html);
    this.logCommunication(to, subject).catch(err => {
      console.error(`Failed to log email communication for ${to}:`, err);
    });
  }

  private async logCommunication(to: string, subject: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email: to } });
    if (user) {
      await this.logRepo.save({
        userId: user.id,
        channel: CommunicationChannel.EMAIL,
        subject,
        type: 'SYSTEM'
      });
    }
  }
}
