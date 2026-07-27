import * as yup from 'yup';

export interface CashRegisterFormData {
  branchId: number;
  name: string;
}

export const cashRegisterSchema: yup.ObjectSchema<CashRegisterFormData> = yup.object().shape({
  branchId: yup
    .number()
    .required('La sucursal es obligatoria')
    .integer('Debe ser un identificador válido')
    .positive('Debe ser un identificador válido'),
  name: yup
    .string()
    .required('El nombre de la caja es obligatorio')
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder los 100 caracteres'),
});
