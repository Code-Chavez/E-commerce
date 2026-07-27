import { BackupConfig } from '@domain/entities/BackupConfig';

export interface IBackupConfigRepository {
  get(): Promise<BackupConfig>;
  update(data: { retentionDays?: number; adminEmail?: string; cronExpression?: string }): Promise<BackupConfig>;
}
