import { IBackupConfigRepository } from '@domain/repositories/IBackupConfigRepository';
import { BackupConfig } from '@domain/entities/BackupConfig';

interface UpdateBackupConfigInput {
  retentionDays?: number;
  adminEmail?: string;
  cronExpression?: string;
}

export class UpdateBackupConfigUseCase {
  constructor(private readonly backupConfigRepository: IBackupConfigRepository) {}

  async execute(input: UpdateBackupConfigInput): Promise<BackupConfig> {
    if (input.retentionDays !== undefined && input.retentionDays < 1) {
      throw new Error('retentionDays debe ser mayor a 0');
    }
    return this.backupConfigRepository.update(input);
  }
}
