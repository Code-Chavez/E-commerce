import * as yup from 'yup';

export const loginSchema = yup.object({
  email: yup
    .string()
    .required('El correo electrónico es obligatorio')
    .email('Debe ser un formato de email válido'),
  password: yup
    .string()
    .required('La contraseña es obligatoria'),
}).required();

export type LoginFormData = yup.InferType<typeof loginSchema>;
