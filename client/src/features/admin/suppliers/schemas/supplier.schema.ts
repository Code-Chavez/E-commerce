import * as Yup from 'yup';

export const supplierSchema = Yup.object().shape({
  ruc: Yup.string()
    .required('El RUC es obligatorio')
    .length(11, 'El RUC debe tener exactamente 11 dígitos')
    .matches(/^\d+$/, 'El RUC debe contener solo números'),
  razonSocial: Yup.string()
    .required('La razón social es obligatoria')
    .min(2, 'La razón social debe tener al menos 2 caracteres')
    .max(200, 'La razón social no puede exceder los 200 caracteres'),
  rubro: Yup.string()
    .required('El rubro es obligatorio')
    .min(2, 'El rubro debe tener al menos 2 caracteres')
    .max(100, 'El rubro no puede exceder los 100 caracteres'),
  contacto: Yup.string()
    .required('El nombre de contacto es obligatorio')
    .min(2, 'El contacto debe tener al menos 2 caracteres')
    .max(100, 'El contacto no puede exceder los 100 caracteres'),
  direccion: Yup.string()
    .nullable()
    .max(255, 'La dirección no puede exceder los 255 caracteres')
    .transform((value) => (value === '' ? null : value)),
});

export type SupplierFormData = Yup.InferType<typeof supplierSchema>;
