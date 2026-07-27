export interface IPdfGenerator {
  generateCreditNotePdf(data: {
    creditNoteCode: string;
    amount: number;
    type: string;
    clientName: string;
    clientEmail: string;
    items: Array<{ name: string; qty: number; unitPrice: number }>;
    createdAt: Date;
  }): Promise<Buffer>;
}
