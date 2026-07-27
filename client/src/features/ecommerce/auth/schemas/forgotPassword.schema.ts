import * as yup from 'yup';

export const forgotPasswordSchema = yup.object({
  email: yup
    .string()
    .required('El correo electrónico es obligatorio')
    .email('Debe ser un formato de email válido'),
}).required();

export type ForgotPasswordFormData = yup.InferType<typeof forgotPasswordSchema>;
