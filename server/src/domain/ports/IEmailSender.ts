export interface IEmailSender {
  sendEmailWithAttachment(options: {
    to: string;
    subject: string;
    html: string;
    attachmentName: string;
    attachmentBuffer: Buffer;
  }): Promise<void>;
}
