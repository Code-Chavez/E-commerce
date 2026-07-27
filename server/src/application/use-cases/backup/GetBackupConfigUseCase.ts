import { IBackupConfigRepository } from '@domain/repositories/IBackupConfigRepository';
import { BackupConfig } from '@domain/entities/BackupConfig';

export class GetBackupConfigUseCase {
  constructor(private readonly backupConfigRepository: IBackupConfigRepository) {}

  async execute(): Promise<BackupConfig> {
    return this.backupConfigRepository.get();
  }
}
