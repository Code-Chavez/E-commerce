import { prisma } from '../prisma';
import { ICommunicationLogRepository } from '../../../domain/repositories/ICommunicationLogRepository';
import {
  CommunicationLog,
  CommunicationChannel,
} from '../../../domain/entities/CommunicationLog';

export class PrismaCommunicationLogRepository implements ICommunicationLogRepository {
  async save(
    log: Omit<CommunicationLog, 'id' | 'sentAt'>
  ): Promise<CommunicationLog> {
    const created = await prisma.communicationLog.create({
      data: {
        userId: log.userId,
        channel: log.channel as any,
        subject: log.subject,
        type: log.type,
      },
    });

    return {
      id: created.id,
      userId: created.userId,
      channel: created.channel as CommunicationChannel,
      subject: created.subject,
      type: created.type,
      sentAt: created.sentAt,
    };
  }

  async findByUserId(userId: number): Promise<CommunicationLog[]> {
    const logs = await prisma.communicationLog.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
    });

    return logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      channel: log.channel as CommunicationChannel,
      subject: log.subject,
      type: log.type,
      sentAt: log.sentAt,
    }));
  }
}
