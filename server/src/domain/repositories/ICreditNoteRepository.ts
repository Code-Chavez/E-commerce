import { CreditNote } from '@domain/entities/CreditNote';
import { RefundType } from '@domain/entities/ReturnRequest';

export interface CreditNoteWithClient extends CreditNote {
  client?: {
    name: string | null;
    email: string;
  };
}

export interface ICreditNoteRepository {
  create(
    data: {
      returnRequestId: number;
      amount: number;
      type: RefundType;
      code: string;
    },
    tx?: any
  ): Promise<CreditNote>;
  findByCode(code: string): Promise<CreditNote | null>;
  findByReturnRequestId(returnRequestId: number): Promise<CreditNote | null>;
  findAll(): Promise<CreditNoteWithClient[]>;
}

