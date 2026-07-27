import { CreditPayment } from './CreditPayment';

export interface ClientCredit {
  id: string;
  clientId: number;
  totalAmount: number;
  installments: number;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
  payments?: CreditPayment[];
}

export function calculatePendingBalance(credit: ClientCredit): number {
  const totalPaid = (credit.payments || []).reduce((sum, payment) => sum + Number(payment.amount), 0);
  return Number((Number(credit.totalAmount) - totalPaid).toFixed(2));
}

export function validateCredit(data: {
  clientId: number;
  totalAmount: number;
  installments: number;
  dueDate: Date;
}) {
  if (!data.clientId || data.clientId <= 0) {
    throw new Error('El ID de cliente es inválido o requerido');
  }
  if (data.totalAmount <= 0) {
    throw new Error('El monto total del crédito debe ser mayor a cero');
  }
  if (data.installments <= 0) {
    throw new Error('El número de cuotas debe ser mayor a cero');
  }
  if (!data.dueDate || isNaN(data.dueDate.getTime())) {
    throw new Error('La fecha de vencimiento es inválida');
  }
}
