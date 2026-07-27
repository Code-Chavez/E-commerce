export type ExpenseType = 'FIXED' | 'VARIABLE';

export interface OperatingExpense {
  id: number;
  branchId: number;
  type: ExpenseType;
  description: string;
  amount: number;
  date: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOperatingExpenseDTO {
  branchId: number;
  type: ExpenseType;
  description: string;
  amount: number;
  date: string;
}

export interface UpdateOperatingExpenseDTO {
  description?: string;
  amount?: number;
}

export interface ExpenseFilters {
  branchId?: number;
  from?: string;
  to?: string;
}
