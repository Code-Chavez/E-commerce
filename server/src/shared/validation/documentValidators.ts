import { z } from 'zod';

export const dniSchema = z
  .string()
  .regex(/^\d{8}$/, 'El DNI debe tener exactamente 8 dígitos');

export const rucSchema = z
  .string()
  .regex(/^\d{11}$/, 'El RUC debe tener exactamente 11 dígitos');

export const nonNegativeInt = z
  .number()
  .int('Debe ser un número entero')
  .nonnegative('No puede ser negativo');

export const positiveInt = z
  .number()
  .int('Debe ser un número entero')
  .positive('Debe ser mayor a 0');

export const nonNegativeMoney = z
  .number()
  .nonnegative('El monto no puede ser negativo')
  .refine(
    (val) => Number.isInteger(Number(val.toFixed(2)) * 100),
    'El monto permite hasta 2 decimales'
  );

export const positiveMoney = z
  .number()
  .positive('El monto debe ser mayor a cero')
  .refine(
    (val) => Number.isInteger(Number(val.toFixed(2)) * 100),
    'El monto permite hasta 2 decimales'
  );

export const percentage0to100 = z
  .number()
  .nonnegative('El porcentaje no puede ser negativo')
  .max(100, 'El porcentaje no puede exceder el 100%');
