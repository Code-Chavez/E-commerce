export interface CreateCashRegisterRequestDTO {
  branchId: number;
  name: string;
}

export interface UpdateCashRegisterRequestDTO {
  branchId?: number;
  name?: string;
}

export interface CashRegisterResponseDTO {
  id: number;
  branchId: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
