export type ExpenseType = 'FIXED' | 'VARIABLE';

export interface OperatingExpense {
  id: number;
  branchId: number;
  type: ExpenseType;
  description: string;
  amount: number;
  date: Date;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOperatingExpenseDTO {
  branchId: number;
  type: ExpenseType;
  description: string;
  amount: number;
  date: Date;
  userId: number;
}

export interface UpdateOperatingExpenseDTO {
  branchId?: number;
  type?: ExpenseType;
  description?: string;
  amount?: number;
  date?: Date;
}

export function validateOperatingExpense(data: {
  amount: number;
  type: string;
  description: string;
  branchId: number;
  userId: number;
}) {
  if (data.amount < 0) {
    throw new Error('El monto del gasto operativo no puede ser negativo');
  }
  if (data.type !== 'FIXED' && data.type !== 'VARIABLE') {
    throw new Error('El tipo de gasto debe ser FIXED o VARIABLE');
  }
  if (!data.description || data.description.trim() === '') {
    throw new Error('La descripción del gasto operativo es obligatoria');
  }
  if (!data.branchId || data.branchId <= 0) {
    throw new Error('La sucursal asociada es inválida');
  }
  if (!data.userId || data.userId <= 0) {
    throw new Error('El usuario registrador es inválido');
  }
}
