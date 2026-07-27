import * as Yup from 'yup';

export const addressSchema = Yup.object().shape({
  alias: Yup.string()
    .min(2, 'El alias debe tener al menos 2 caracteres')
    .max(50, 'El alias no puede exceder los 50 caracteres')
    .required('El alias es requerido'),
  fullAddress: Yup.string()
    .min(5, 'La dirección debe tener al menos 5 caracteres')
    .required('La dirección completa es requerida'),
  district: Yup.string()
    .min(2, 'El distrito debe tener al menos 2 caracteres')
    .required('El distrito es requerido'),
  reference: Yup.string().default(''),
  isDefault: Yup.boolean().default(false),
});

export type AddressFormData = {
  alias: string;
  fullAddress: string;
  district: string;
  reference: string;
  isDefault: boolean;
};
