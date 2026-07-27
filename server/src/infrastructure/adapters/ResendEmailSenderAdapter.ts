import { IEmailSender } from '@domain/ports/IEmailSender';
import { Resend } from 'resend';

export class ResendEmailSenderAdapter implements IEmailSender {
  private resend: Resend | null;
  private readonly defaultFrom = process.env.RESEND_FROM_EMAIL || 'DMendoza <noreply@dmendoza.shop>';

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey && apiKey !== 're_1234567890_placeholder') {
      this.resend = new Resend(apiKey);
    } else {
      this.resend = null;
    }
  }

  async sendEmailWithAttachment(options: {
    to: string;
    subject: string;
    html: string;
    attachmentName: string;
    attachmentBuffer: Buffer;
  }): Promise<void> {
    if (!this.resend) {
      console.log('--- SIMULACIÓN DE ENVÍO DE EMAIL CON ADJUNTO ---');
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Attachment: ${options.attachmentName} (${options.attachmentBuffer.length} bytes)`);
      console.log('------------------------------------');
      return;
    }

    try {
      const { error } = await this.resend.emails.send({
        from: this.defaultFrom,
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: [
          {
            filename: options.attachmentName,
            content: options.attachmentBuffer,
          },
        ],
      });

      if (error) {
        console.error('Error sending email with Resend:', error);
        throw new Error(`Error sending email: ${error.message}`);
      }
    } catch (error) {
      console.error('Unexpected error in ResendEmailSenderAdapter:', error);
      throw error;
    }
  }
}
