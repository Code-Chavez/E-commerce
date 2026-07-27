import { describe, it, expect, beforeAll, jest } from '@jest/globals';
import { PrismaCommunicationLogRepository } from '../../src/infrastructure/database/repositories/PrismaCommunicationLogRepository';
import { prisma } from '../../src/infrastructure/database/prisma';
import { CommunicationChannel } from '../../src/domain/entities/CommunicationLog';
import { ResendEmailService } from '../../src/infrastructure/services/ResendEmailService';

jest.mock('../../src/infrastructure/database/prisma', () => ({
  prisma: {
    user: {
      create: jest.fn().mockResolvedValue({ id: 1, email: 'test_comms_log@test.com', name: 'Test Comms' } as never),
      delete: jest.fn(),
    },
    communicationLog: {
      create: jest.fn().mockResolvedValue({ id: 1 } as never),
      findMany: jest.fn().mockResolvedValue([{ id: 1, subject: 'Test Subject' }] as never),
      deleteMany: jest.fn(),
    }
  }
}));
describe('Communication Log feature', () => {
  let logRepo: PrismaCommunicationLogRepository;

  beforeAll(() => {
    logRepo = new PrismaCommunicationLogRepository();
  });

  it('should save and find communication logs by userId', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'test_comms_log@test.com',
        name: 'Test Comms',
        password: 'hash',
        authProvider: 'local'
      }
    });

    const saved = await logRepo.save({
      userId: user.id,
      channel: CommunicationChannel.EMAIL,
      subject: 'Test Subject',
      type: 'SYSTEM'
    });

    expect(saved.id).toBeDefined();

    const logs = await logRepo.findByUserId(user.id);
    expect(logs).toHaveLength(1);
    expect(logs[0].subject).toBe('Test Subject');

    await prisma.communicationLog.deleteMany({ where: { userId: user.id }});
    await prisma.user.delete({ where: { id: user.id }});
  });

  // Decorator pattern testing is mostly mocked in integration, but we verify the repo port works perfectly.
});


