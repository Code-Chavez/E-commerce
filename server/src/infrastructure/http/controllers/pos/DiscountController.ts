import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

/**
 * HU-034 / T-125: Controlador para validación de descuentos en el POS.
 *
 * Endpoint: POST /api/v1/pos/discounts/validate
 *
 * Requiere el permiso RBAC 'pos:discounts' para ejecutar la lógica de descuento.
 * El middleware `requirePermission('pos:discounts')` se encarga de verificar este
 * acceso antes de que la petición llegue al controlador.
 */

// ─── Esquema de validación Zod ─────────────────────────────────────────────────

const ValidateDiscountSchema = z.object({
  /**
   * Lista de ítems del carrito de compra con sus precios y cantidades.
   */
  items: z
    .array(
      z.object({
        variantId: z.number().int().positive('El variantId debe ser un entero positivo'),
        quantity: z.number().int().positive('La cantidad debe ser un entero positivo'),
        unitPrice: z.number().nonnegative('El precio unitario no puede ser negativo'),
      })
    )
    .min(1, 'Se requiere al menos un ítem para calcular el descuento'),

  /**
   * Tipo de descuento a aplicar:
   * - "percentage" → porcentaje sobre el subtotal (ej. 10 = 10%)
   * - "fixed"      → monto fijo en moneda local (ej. 5.00 = S/. 5.00)
   */
  discountType: z.enum(['percentage', 'fixed']).refine(
    (val) => val === 'percentage' || val === 'fixed',
    { message: 'discountType debe ser "percentage" o "fixed"' }
  ),

  /**
   * Valor del descuento. Debe ser mayor que cero.
   * - Si discountType es "percentage": valor entre 0.01 y 100.
   * - Si discountType es "fixed": valor mayor que 0.
   */
  discountValue: z.number().positive('El valor del descuento debe ser mayor que cero'),
}).refine(
  (data) => {
    if (data.discountType === 'percentage' && data.discountValue > 100) {
      return false;
    }
    return true;
  },
  {
    message: 'El porcentaje de descuento no puede exceder el 100%',
    path: ['discountValue'],
  }
);

// ─── Tipo inferido del esquema ────────────────────────────────────────────────

type ValidateDiscountInput = z.infer<typeof ValidateDiscountSchema>;

// ─── Controlador ─────────────────────────────────────────────────────────────

export class DiscountController {
  /**
   * POST /api/v1/pos/discounts/validate
   *
   * Verifica el permiso RBAC (delegado al middleware), calcula el subtotal
   * de los ítems y aplica el descuento (porcentaje o monto fijo).
   * Devuelve el desglose financiero: subtotal, discountAmount y total final.
   *
   * @param req - Express Request con `req.auth` (inyectado por `requirePermission`)
   * @param res - Express Response
   * @param next - Express NextFunction para propagación de errores
   */
  async validate(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. Validar el cuerpo de la petición con Zod
      const validation = ValidateDiscountSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: validation.error.issues,
        });
      }

      const { items, discountType, discountValue }: ValidateDiscountInput = validation.data;

      // 2. Calcular el subtotal de los ítems del carrito
      const subtotal = items.reduce((acc, item) => {
        return acc + item.unitPrice * item.quantity;
      }, 0);

      // 3. Calcular el monto del descuento según el tipo seleccionado
      let discountAmount: number;

      if (discountType === 'percentage') {
        if (discountValue > 100) {
          return res.status(400).json({
            success: false,
            error: 'El descuento porcentual no puede superar el 100%',
          });
        }
        discountAmount = (subtotal * discountValue) / 100;
      } else {
        // discountType === 'fixed'
        if (discountValue > subtotal) {
          return res.status(400).json({
            success: false,
            error: 'El descuento fijo no puede superar el subtotal de la orden',
          });
        }
        discountAmount = discountValue;
      }

      // 4. Calcular el total final después del descuento
      const total = subtotal - discountAmount;

      // 5. Retornar la respuesta con el desglose financiero
      return res.status(200).json({
        success: true,
        data: {
          subtotal: parseFloat(subtotal.toFixed(2)),
          discountType,
          discountValue,
          discountAmount: parseFloat(discountAmount.toFixed(2)),
          total: parseFloat(total.toFixed(2)),
          appliedBy: {
            userId: req.auth?.userId,
            email: req.auth?.email,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
