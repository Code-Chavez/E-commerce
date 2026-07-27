import * as yup from 'yup';

export interface BranchFormData {
  name: string;
  address: string | null;
  phone: string | null;
  isMain: boolean;
  igvExempt: boolean;
}

export const branchSchema: yup.ObjectSchema<BranchFormData> = yup.object().shape({
  name: yup
    .string()
    .required('El nombre de la sucursal es obligatorio')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder los 100 caracteres'),
  address: yup
    .string()
    .transform((value) => (value === '' ? null : value))
    .default(null)
    .nullable()
    .max(255, 'La dirección no puede exceder los 255 caracteres'),
  phone: yup
    .string()
    .transform((value) => (value === '' ? null : value))
    .default(null)
    .nullable()
    .max(20, 'El teléfono no puede exceder los 20 caracteres'),
  isMain: yup
    .boolean()
    .default(false)
    .required(),
  igvExempt: yup
    .boolean()
    .default(false)
    .required(),
});
