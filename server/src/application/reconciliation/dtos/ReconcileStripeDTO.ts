import { z } from 'zod';

export const ReconcileStripeDTOSchema = z.object({
  from: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "La fecha 'from' debe ser una fecha válida (formato ISO 8601)",
  }),
  to: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "La fecha 'to' debe ser una fecha válida (formato ISO 8601)",
  }),
}).refine((data) => {
  const fromDate = new Date(data.from);
  const toDate = new Date(data.to);
  return fromDate <= toDate;
}, {
  message: "La fecha 'from' debe ser anterior o igual a la fecha 'to'",
  path: ['from'],
});

export type ReconcileStripeDTO = z.infer<typeof ReconcileStripeDTOSchema>;
