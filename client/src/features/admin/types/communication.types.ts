export type CommunicationChannel = 'EMAIL' | 'WHATSAPP';

export interface CommunicationLog {
  id: number;
  userId: number;
  channel: CommunicationChannel;
  subject: string;
  type: string;
  sentAt: string;
}

export interface ClientCommunicationsResponse {
  success: boolean;
  data: CommunicationLog[];
}
