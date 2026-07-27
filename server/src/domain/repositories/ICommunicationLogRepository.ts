import { CommunicationLog } from "../entities/CommunicationLog";

export interface ICommunicationLogRepository {
  save(log: Omit<CommunicationLog, 'id' | 'sentAt'>): Promise<CommunicationLog>;
  findByUserId(userId: number): Promise<CommunicationLog[]>;
}
