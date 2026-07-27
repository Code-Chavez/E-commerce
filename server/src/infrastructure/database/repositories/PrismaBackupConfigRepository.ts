import prisma from '@infrastructure/database/prisma';
import { IBackupConfigRepository } from '@domain/repositories/IBackupConfigRepository';
import { BackupConfig } from '@domain/entities/BackupConfig';

export class PrismaBackupConfigRepository implements IBackupConfigRepository {
  private toDomain(record: any): BackupConfig {
    return {
      id: record.id,
      retentionDays: record.retentionDays,
      adminEmail: record.adminEmail,
      cronExpression: record.cronExpression,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async get(): Promise<BackupConfig> {
    let config = await prisma.backupConfig.findFirst();
    if (!config) {
      config = await prisma.backupConfig.create({ data: {} });
    }
    return this.toDomain(config);
  }

  async update(data: { retentionDays?: number; adminEmail?: string; cronExpression?: string }): Promise<BackupConfig> {
    let config = await prisma.backupConfig.findFirst();
    if (!config) {
      config = await prisma.backupConfig.create({ data: {} });
    }
    const updated = await prisma.backupConfig.update({
      where: { id: config.id },
      data,
    });
    return this.toDomain(updated);
  }
}
