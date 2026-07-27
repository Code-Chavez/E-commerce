export interface OpenCashTurnRequestDTO {
  registerId: number;
  userId: number;
  openAmount: number;
}

export interface CashTurnResponseDTO {
  id: number;
  registerId: number;
  userId: number;
  openAmount: number;
  status: 'OPEN' | 'CLOSED';
  openedAt: Date;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  branchId: number | null;
  igvExempt: boolean;
}
