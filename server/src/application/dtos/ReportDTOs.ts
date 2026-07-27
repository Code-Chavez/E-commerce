import { z } from "zod";

export const LowRotationQuerySchema = z.object({
  days: z.string().optional().default("90").transform((val) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed < 1) return 90;
    return parsed;
  })
});

export type LowRotationQueryDTO = z.infer<typeof LowRotationQuerySchema>;
