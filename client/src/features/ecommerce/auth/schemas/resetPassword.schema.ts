import * as yup from 'yup';

export const resetPasswordSchema = yup.object({
  newPassword: yup
    .string()
    .required('La nueva contraseña es obligatoria')
    .min(8, 'Mínimo 8 caracteres')
    .matches(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
    .matches(/[0-9]/, 'Debe contener al menos un número'),
}).required();

export type ResetPasswordFormData = yup.InferType<typeof resetPasswordSchema>;
