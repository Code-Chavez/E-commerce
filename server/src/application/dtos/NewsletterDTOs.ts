import { z } from 'zod';

export const SubscribeNewsletterSchema = z.object({
  email: z.string().email({ message: 'Invalid email format' }),
});

export type SubscribeNewsletterDTO = z.infer<typeof SubscribeNewsletterSchema>;

export const UnsubscribeNewsletterSchema = z.object({
  email: z.string().email({ message: 'Invalid email format' }),
});

export type UnsubscribeNewsletterDTO = z.infer<
  typeof UnsubscribeNewsletterSchema
>;

export const GetNewsletterSubscribersQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/)
    .optional()
    .transform((v) => (v ? Number(v) : 1)),
  limit: z
    .string()
    .regex(/^\d+$/)
    .optional()
    .transform((v) => (v ? Number(v) : 10)),
  format: z.enum(['csv', 'excel']).optional(),
});

export type GetNewsletterSubscribersQueryDTO = z.infer<
  typeof GetNewsletterSubscribersQuerySchema
>;
