import * as yup from 'yup';

export interface QuickRegisterFormData {
  documentType: 'DNI' | 'RUC';
  documentId: string;
  phone: string;
  email?: string;
}

export const quickRegisterSchema: yup.ObjectSchema<QuickRegisterFormData> = yup.object().shape({
  documentType: yup
    .string()
    .oneOf(['DNI', 'RUC'] as const, 'El tipo de documento debe ser DNI o RUC')
    .required('El tipo de documento es obligatorio'),
  documentId: yup
    .string()
    .required('El número de documento es obligatorio')
    .test('len', 'El número de documento debe ser válido', (val, context) => {
      const type = context.parent.documentType;
      if (type === 'DNI') {
        return val?.length === 8 && /^\d+$/.test(val);
      }
      if (type === 'RUC') {
        return val?.length === 11 && /^\d+$/.test(val);
      }
      return false;
    }),
  phone: yup
    .string()
    .required('El teléfono es obligatorio')
    .min(9, 'El teléfono debe tener al menos 9 dígitos')
    .max(20, 'El teléfono no puede exceder los 20 dígitos')
    .matches(/^\+?[0-9\s-]+$/, 'El formato de teléfono es inválido'),
  email: yup
    .string()
    .transform((value) => (value === '' ? undefined : value))
    .email('El formato de correo electrónico es inválido')
    .optional(),
});
