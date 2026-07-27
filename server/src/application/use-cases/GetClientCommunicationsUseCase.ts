import { ICommunicationLogRepository } from '../../domain/repositories/ICommunicationLogRepository';
import { CommunicationLog } from '../../domain/entities/CommunicationLog';
import { prisma } from '../../infrastructure/database/prisma';

export class GetClientCommunicationsUseCase {
  constructor(private readonly logRepository: ICommunicationLogRepository) {}

  async execute(clientId: number): Promise<CommunicationLog[]> {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client || !client.userId) {
      return []; // No user account, so no logs
    }

    return this.logRepository.findByUserId(client.userId);
  }
}
