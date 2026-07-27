import { z } from 'zod';

export const CreateRoleDTOSchema = z.object({
  name: z
    .string()
    .min(3, { message: "El nombre del rol debe tener al menos 3 caracteres" })
    .max(50)
    .transform(val => val.toUpperCase()), // Normalize to uppercase automatically
  description: z.string().max(255).optional(),
});

export type CreateRoleRequestDTO = z.infer<typeof CreateRoleDTOSchema>;

export const AssignRoleDTOSchema = z.object({
  roleName: z
    .string()
    .min(1, { message: "El nombre del rol es requerido" })
    .transform(val => val.toUpperCase()),
});

export type AssignRoleRequestDTO = z.infer<typeof AssignRoleDTOSchema>;
