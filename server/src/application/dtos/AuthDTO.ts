import { z } from 'zod';

export const RegisterUserDTOSchema = z.object({
  email: z.string().email({ message: "Formato de correo electrónico no válido" }),
  password: z
    .string()
    .min(8, { message: "La contraseña debe tener al menos 8 caracteres" })
    .regex(/[A-Z]/, { message: "La contraseña debe contener al menos una letra mayúscula" })
    .regex(/[0-9]/, { message: "La contraseña debe contener al menos un número" })
});

export type RegisterUserDTO = z.infer<typeof RegisterUserDTOSchema>;

export const VerifyUserDTOSchema = z.object({
  email: z.string().email({ message: "Formato de correo electrónico no válido" }),
  pin: z
    .string()
    .length(6, { message: "El PIN debe tener exactamente 6 dígitos" })
    .regex(/^\d{6}$/, { message: "El PIN debe contener solo números" }),
});

export type VerifyUserDTO = z.infer<typeof VerifyUserDTOSchema>;

export const LoginDTOSchema = z.object({
  email: z.string().email({ message: "Formato de correo electrónico no válido" }),
  password: z.string().min(1, { message: "La contraseña es requerida" }),
});

export type LoginDTO = z.infer<typeof LoginDTOSchema>;

export const ForgotPasswordDTOSchema = z.object({
  email: z.string().email({ message: "Formato de correo electrónico no válido" }),
});

export type ForgotPasswordDTO = z.infer<typeof ForgotPasswordDTOSchema>;

export const ResetPasswordDTOSchema = z.object({
  token: z.string().min(1, { message: "El token es requerido" }),
  newPassword: z
    .string()
    .min(8, { message: "La contraseña debe tener al menos 8 caracteres" })
    .regex(/[A-Z]/, { message: "La contraseña debe contener al menos una letra mayúscula" })
    .regex(/[0-9]/, { message: "La contraseña debe contener al menos un número" }),
});

export type ResetPasswordDTO = z.infer<typeof ResetPasswordDTOSchema>;

// RSK-001 / T-043: Sliding-window token renewal
export const RefreshTokenDTOSchema = z.object({
  refreshToken: z.string().min(1, { message: 'El refresh token es requerido' }),
});

export type RefreshTokenDTO = z.infer<typeof RefreshTokenDTOSchema>;

/**
 * DTO para el perfil recibido desde Google OAuth 2.0 (HU-001 / T-033).
 * Se construye a partir del profile de Passport, no del request body.
 */
export interface GoogleProfileDTO {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}
