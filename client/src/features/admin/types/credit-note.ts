export type RefundType = 'CREDIT_NOTE' | 'STORE_CREDIT';

export interface CreditNoteClient {
  name: string | null;
  email: string;
}

export interface CreditNote {
  id: number;
  returnRequestId: number;
  amount: number;
  type: RefundType;
  code: string;
  usedAt: string | null;
  createdAt: string;
  updatedAt: string;
  client?: CreditNoteClient;
}

export interface CreditNoteListResponse {
  success: boolean;
  data: CreditNote[];
}
