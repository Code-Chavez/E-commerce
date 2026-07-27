import * as Yup from 'yup';

export const auditSchema = Yup.object().shape({
  branchId: Yup.number()
    .required('Debe seleccionar una sucursal para auditar')
    .positive('Sucursal inválida')
    .integer(),
  status: Yup.string()
    .oneOf(['PENDING', 'CONFIRMED'], 'Estado de auditoría inválido')
    .required(),
  items: Yup.array()
    .of(
      Yup.object().shape({
        variantId: Yup.number()
          .required('Variante requerida')
          .positive('Variante inválida')
          .integer(),
        sku: Yup.string().required('El SKU es obligatorio'),
        productName: Yup.string().required('El nombre del producto es obligatorio'),
        systemQty: Yup.number()
          .required('El stock del sistema es obligatorio')
          .min(0, 'El stock del sistema no puede ser negativo'),
        physicalQty: Yup.number()
          .transform((value) => (isNaN(value) || value === null ? 0 : value))
          .required('El conteo físico es obligatorio')
          .min(0, 'El conteo físico debe ser mayor o igual a 0')
          .integer('El conteo físico debe ser un número entero'),
      })
    )
    .min(1, 'La toma de inventario debe contener al menos un ítem'),
});

export type AuditFormData = Yup.InferType<typeof auditSchema>;
export type AuditItemFormData = NonNullable<AuditFormData['items']>[number];
