import { z } from 'zod';

export const CreateCreditDTOSchema = z.object({
  clientId: z.number().int().positive('El ID de cliente debe ser un número entero positivo'),
  totalAmount: z.number().positive('El monto total debe ser mayor a cero'),
  installments: z.number().int().positive('El número de cuotas debe ser mayor a cero'),
  dueDate: z.preprocess((val) => {
    if (typeof val === 'string' || val instanceof Date) return new Date(val);
    return val;
  }, z.date().refine((val) => !isNaN(val.getTime()), { message: 'Fecha de vencimiento inválida' }))
});

export type CreateCreditDTO = z.infer<typeof CreateCreditDTOSchema>;

export const CreatePaymentDTOSchema = z.object({
  amount: z.number().positive('El monto del pago debe ser mayor a cero')
});

export type CreatePaymentDTO = z.infer<typeof CreatePaymentDTOSchema>;
