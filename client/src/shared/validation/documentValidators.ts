import * as Yup from 'yup';

export const dniSchemaYup = Yup.string()
  .required('El DNI es obligatorio')
  .matches(/^\d{8}$/, 'El DNI debe tener exactamente 8 dígitos');

export const rucSchemaYup = Yup.string()
  .required('El RUC es obligatorio')
  .matches(/^\d{11}$/, 'El RUC debe tener exactamente 11 dígitos');

export const nonNegativeIntYup = Yup.number()
  .integer('Debe ser un número entero')
  .min(0, 'No puede ser negativo');

export const positiveIntYup = Yup.number()
  .integer('Debe ser un número entero')
  .min(1, 'Debe ser mayor a 0');

export const nonNegativeMoneyYup = Yup.number()
  .min(0, 'El monto no puede ser negativo');

export const positiveMoneyYup = Yup.number()
  .min(0.01, 'El monto debe ser mayor a cero');

export const percentage0to100Yup = Yup.number()
  .min(0, 'El porcentaje no puede ser negativo')
  .max(100, 'El porcentaje no puede exceder el 100%');

// Helpers para onKeyDown en React
export const handleNumericKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  // Bloquear e, E, +, -
  if (['e', 'E', '+', '-'].includes(e.key)) {
    e.preventDefault();
  }
};

export const handleIntegerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  // Bloquear e, E, +, -, y el punto decimal
  if (['e', 'E', '+', '-', '.', ','].includes(e.key)) {
    e.preventDefault();
  }
};
