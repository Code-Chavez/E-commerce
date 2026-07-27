export enum CommunicationChannel {
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP'
}

export interface CommunicationLog {
  id: number;
  userId: number;
  channel: CommunicationChannel;
  subject: string;
  type: string;
  sentAt: Date;
}
