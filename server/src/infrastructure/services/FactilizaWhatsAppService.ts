import { IWhatsAppService } from '@domain/services/IWhatsAppService';
import axios from 'axios';
import { PrismaCommunicationLogRepository } from '../database/repositories/PrismaCommunicationLogRepository';
import { prisma } from '../database/prisma';
import { CommunicationChannel } from '@domain/entities/CommunicationLog';

class BaseFactilizaWhatsAppService implements IWhatsAppService {
  private apiToken: string | undefined;

  constructor() {
    this.apiToken = process.env.FACTILIZA_TOKEN;

    if (!this.apiToken) {
      console.warn(
        'Factiliza credentials not fully configured. WhatsApp notifications will be mocked/ignored.'
      );
    }
  }

  async sendMessage(
    phone: string,
    template: string,
    params: Record<string, string>
  ): Promise<boolean> {
    if (!this.apiToken) {
      console.log(
        `[Mock WhatsApp Factiliza] To: ${phone}, Template: ${template}, Params:`,
        params
      );
      return true; // Simulate success if not configured
    }

    try {
      let body = `Notificación: ${template}\n`;
      for (const [key, value] of Object.entries(params)) {
        body += `- ${key}: ${value}\n`;
      }

      // Limpiar el número para asegurarse de que no tenga el signo + y sea sólo números según los estándares comunes
      const cleanPhone = phone.replace(/\D/g, '');

      // De acuerdo a las prácticas de Factiliza
      await axios.post(
        'https://api.factiliza.com/api/v1/whatsapp/send-message',
        {
          number: cleanPhone,
          message: body.trim(),
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiToken}`,
          },
        }
      );

      return true;
    } catch (error) {
      console.error('Error sending WhatsApp message via Factiliza:', error);
      return false; // Return false instead of throwing to avoid breaking the main flow
    }
  }
}

export class FactilizaWhatsAppService implements IWhatsAppService {
  private baseService: BaseFactilizaWhatsAppService;
  private logRepo: PrismaCommunicationLogRepository;

  constructor() {
    this.baseService = new BaseFactilizaWhatsAppService();
    this.logRepo = new PrismaCommunicationLogRepository();
  }

  async sendMessage(
    phone: string,
    template: string,
    params: Record<string, string>
  ): Promise<boolean> {
    const success = await this.baseService.sendMessage(phone, template, params);
    this.logCommunication(phone, template).catch((err) => {
      console.error(`Failed to log WhatsApp communication for ${phone}:`, err);
    });
    return success;
  }

  private async logCommunication(
    phone: string,
    template: string
  ): Promise<void> {
    const cleanPhone = phone.replace(/\D/g, '');
    const client = await prisma.client.findFirst({
      where: {
        OR: [{ phone: cleanPhone }, { phone: phone }],
      },
    });

    if (client && client.userId) {
      await this.logRepo.save({
        userId: client.userId,
        channel: CommunicationChannel.WHATSAPP,
        subject: `Template: ${template}`,
        type: 'NOTIFICATION',
      });
    }
  }
}
