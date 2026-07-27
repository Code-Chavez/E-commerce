import * as Yup from 'yup';

export const profileSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder los 50 caracteres')
    .required('El nombre es requerido'),
  lastName: Yup.string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede exceder los 50 caracteres')
    .required('El apellido es requerido'),
  phone: Yup.string()
    .matches(/^\+[1-9]\d{1,14}$/, 'El teléfono debe estar en formato internacional E.164 (ej: +51999888777)')
    .required('El teléfono es requerido'),
});

export type ProfileFormData = Yup.InferType<typeof profileSchema>;
