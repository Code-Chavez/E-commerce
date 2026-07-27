import * as Yup from 'yup';

export const stockEntrySchema = Yup.object().shape({
  supplierId: Yup.number()
    .required('Debe seleccionar un proveedor')
    .positive('Proveedor inválido')
    .integer(),
  invoiceNumber: Yup.string()
    .required('El número de factura/boleta es obligatorio')
    .max(50, 'El número de comprobante no puede exceder los 50 caracteres')
    .matches(/^[A-Z0-9\-]+$/i, 'Solo se permiten letras, números y guiones en el número de comprobante'),
  branchId: Yup.number()
    .required('Debe seleccionar una sucursal de destino')
    .positive('Sucursal inválida')
    .integer(),
  items: Yup.array()
    .of(
      Yup.object().shape({
        variantId: Yup.number()
          .required('Variante requerida')
          .positive('Variante inválida')
          .integer(),
        sku: Yup.string().required('El SKU es obligatorio'),
        productName: Yup.string().required('El nombre del producto es obligatorio'),
        quantity: Yup.number()
          .required('La cantidad es obligatoria')
          .positive('La cantidad debe ser mayor a 0')
          .integer('La cantidad debe ser un número entero'),
        unitCost: Yup.number()
          .required('El costo unitario es obligatorio')
          .positive('El costo unitario debe ser mayor a 0'),
        distributions: Yup.array().of(
          Yup.object().shape({
            branchId: Yup.number().required(),
            branchName: Yup.string().required(),
            quantity: Yup.number()
              .transform((value) => (isNaN(value) || value === null ? 0 : value))
              .min(0, 'No puede ser negativo')
              .integer('Debe ser entero')
              .required(),
          })
        ).test(
          'sum-not-exceed-total',
          'La cantidad total distribuida no puede superar la cantidad ingresada',
          function (distributions) {
            const quantity = Number(this.parent.quantity) || 0;
            const sum = (distributions || []).reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
            return sum <= quantity;
          }
        ),
      })
    )
    .min(1, 'Debe agregar al menos un ítem al ingreso de mercadería'),
});

export type StockEntryFormData = Yup.InferType<typeof stockEntrySchema>;
export type StockEntryItemFormData = NonNullable<Yup.InferType<typeof stockEntrySchema>['items']>[number];
export type DistributionItemForm = NonNullable<StockEntryItemFormData['distributions']>[number];
