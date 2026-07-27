import { RefundType } from './ReturnRequest';

export interface CreditNote {
  id: number;
  returnRequestId: number;
  amount: number;
  type: RefundType;
  code: string;
  usedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
