export interface BackupConfig {
  id: number;
  retentionDays: number;
  adminEmail: string;
  cronExpression: string;
  createdAt: Date;
  updatedAt: Date;
}
