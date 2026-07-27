import { Request, Response } from 'express';
import prisma from '@infrastructure/database/prisma';
import { CancelSaleUseCase } from '@application/use-cases/pos/CancelSaleUseCase';
import { ConfirmCrossBranchSaleUseCase } from '@application/use-cases/pos/ConfirmCrossBranchSaleUseCase';

import { z } from 'zod';
import { positiveMoney } from '@shared/validation/documentValidators';

const SaleItemSchema = z.object({
  variantId: z.number().int().positive(),
  quantity: z.number().int().positive('La cantidad debe ser mayor a cero'),
  price: z.number().nonnegative(),
  subtotal: z.number().nonnegative(),
});

const SalePaymentSchema = z.object({
  method: z.enum([
    'CASH',
    'CREDIT_CARD',
    'DEBIT_CARD',
    'TRANSFER',
    'YAPE',
    'PLIN',
    'CREDIT_NOTE',
  ]),
  amount: positiveMoney,
  code: z.string().optional(),
});

const ProcessSaleSchema = z.object({
  branchId: z.number().int().positive(),
  clientId: z.number().int().positive().optional(),
  items: z.array(SaleItemSchema).min(1, 'Debe haber al menos un ítem'),
  subtotal: z.number().nonnegative(),
  discountTotal: z.number().nonnegative().optional().default(0),
  total: z.number().nonnegative(),
  payments: z.array(SalePaymentSchema).min(1, 'Debe haber al menos un pago'),
  isCrossBranch: z.boolean().optional(),
  sourceBranchId: z.number().int().positive().optional().nullable(),
  documentType: z
    .enum(['TICKET', 'BOLETA', 'FACTURA'])
    .optional()
    .default('TICKET'),
});

const cancelSaleUseCase = new CancelSaleUseCase();
const confirmCrossBranchSaleUseCase = new ConfirmCrossBranchSaleUseCase();

export class SaleController {
  async processSale(req: Request, res: Response) {
    try {
      const parsed = ProcessSaleSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: parsed.error.issues,
        });
      }

      let {
        branchId,
        clientId,
        items,
        subtotal,
        discountTotal,
        total,
        payments,
        isCrossBranch,
        sourceBranchId,
        documentType,
      } = parsed.data;
      const userId = req.auth?.userId;
      const userRole = req.auth?.role;
      const authBranchId = req.auth?.branchId;

      // Enforce branch isolation for non-admins (e.g., SELLER)
      // They can only sell from their own branch (unless cross-branch logic specifically allows it)
      if (userRole !== 'ADMIN' && userRole !== 'SUPERADMIN') {
        if (authBranchId) {
          branchId = authBranchId;
        }
      }

      // Validar cliente si fue proporcionado
      if (clientId) {
        const clientExists = await prisma.client.findUnique({
          where: { id: clientId },
        });
        if (!clientExists) {
          return res.status(400).json({
            success: false,
            error: 'El cliente proporcionado no existe.',
          });
        }
      }

      // Validar turno activo (HU-032)
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no autenticado para registrar venta.',
        });
      }

      const activeTurn = await prisma.cashTurn.findFirst({
        where: { userId, status: 'OPEN' },
      });

      if (!activeTurn) {
        return res.status(403).json({
          success: false,
          error: 'No tienes un turno de caja abierto para registrar ventas.',
        });
      }

      // Validar que la suma de pagos cubra el total
      const paymentsSum = payments.reduce(
        (sum: number, p: any) => sum + Number(p.amount),
        0
      );
      if (paymentsSum < total) {
        return res.status(400).json({
          success: false,
          error: `El pago (S/. ${paymentsSum.toFixed(2)}) no cubre el total (S/. ${total.toFixed(2)}).`,
        });
      }

      // 2. Transacción
      const result = await prisma.$transaction(async (tx) => {
        const isTransfer =
          isCrossBranch && sourceBranchId && sourceBranchId !== branchId;
        const targetStockBranchId = isTransfer ? sourceBranchId : branchId;

        // A) Validar Stock
        for (const item of items) {
          const branchStock = await tx.branchStock.findUnique({
            where: {
              variantId_branchId_status: {
                variantId: item.variantId,
                branchId: targetStockBranchId,
                status: 'AVAILABLE',
              },
            },
          });

          if (!branchStock || branchStock.quantity < item.quantity) {
            throw new Error(
              `Stock insuficiente para el producto/variante ID ${item.variantId}. Disponible: ${branchStock?.quantity || 0}, Requerido: ${item.quantity}.`
            );
          }
        }

        // B) Crear Venta (PosOrder) y sus Ítems con serie y correlativo formal
        // Congelar el costo unitario vigente de cada variante para trazabilidad de margen
        const variantCosts = await tx.productVariant.findMany({
          where: { id: { in: items.map((i: any) => i.variantId) } },
          select: { id: true, costPrice: true },
        });
        const costByVariant: Record<number, number> = {};
        for (const v of variantCosts) {
          costByVariant[v.id] = Number(v.costPrice ?? 0);
        }

        const docType =
          documentType && ['BOLETA', 'FACTURA', 'TICKET'].includes(documentType)
            ? documentType
            : 'TICKET';

        const sequence = await tx.documentSequence.upsert({
          where: {
            branchId_documentType: {
              branchId,
              documentType: docType,
            },
          },
          update: {
            nextNumber: {
              increment: 1,
            },
          },
          create: {
            branchId,
            documentType: docType,
            series:
              docType === 'BOLETA'
                ? `B${String(branchId).padStart(3, '0')}`
                : docType === 'FACTURA'
                  ? `F${String(branchId).padStart(3, '0')}`
                  : `T${String(branchId).padStart(3, '0')}`,
            nextNumber: 2,
          },
        });

        const currentSeries = sequence.series;
        const currentCorrelative = sequence.nextNumber - 1;

        const order = await tx.posOrder.create({
          data: {
            branchId,
            userId,
            clientId,
            cashTurnId: activeTurn.id, // HU-032: Asociar la venta al turno activo
            documentType: docType,
            series: currentSeries,
            correlative: currentCorrelative,
            subtotal,
            discountTotal,
            total,
            status: 'COMPLETED',
            isCrossBranch: isCrossBranch || false,
            sourceBranchId: isTransfer ? sourceBranchId : null,
            items: {
              create: items.map((item: any) => ({
                variantId: item.variantId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                unitCost: costByVariant[item.variantId] ?? 0,
                discountAmount: item.discountAmount || 0,
                lineTotal:
                  item.unitPrice * item.quantity - (item.discountAmount || 0),
              })),
            },
          },
        });

        // C) Validar y procesar Pagos
        let remainingTotal = total;
        const paymentsToCreate = [];

        for (const p of payments) {
          if (remainingTotal <= 0) break;

          let amountToCharge = Math.min(Number(p.amount), remainingTotal);
          let creditNoteId = null;

          if (p.method === 'CREDIT_NOTE') {
            if (!p.code) {
              throw new Error(
                'Debe proporcionar el código del vale de crédito.'
              );
            }

            const creditNote = await tx.creditNote.findUnique({
              where: { code: p.code },
            });

            if (!creditNote) {
              throw new Error(
                `El vale de crédito con código ${p.code} no existe.`
              );
            }

            if (creditNote.type !== 'STORE_CREDIT') {
              throw new Error(
                `El código proporcionado no es un saldo a favor válido para canjear en tienda.`
              );
            }

            if (creditNote.usedAt !== null) {
              throw new Error(`El vale de crédito ${p.code} ya fue utilizado.`);
            }

            if (creditNote.amount > remainingTotal) {
              throw new Error(
                `El monto del vale (S/. ${creditNote.amount}) supera el saldo restante de la venta (S/. ${remainingTotal}). Debe complementarse con otra venta de igual o mayor monto.`
              );
            }

            // Aplicar vale
            amountToCharge = creditNote.amount;
            creditNoteId = creditNote.id;

            // Marcar como usado atómicamente previendo concurrencia
            const updated = await tx.creditNote.updateMany({
              where: { code: p.code, usedAt: null },
              data: { usedAt: new Date() },
            });

            if (updated.count !== 1) {
              throw new Error(
                `El vale de crédito ${p.code} ya fue utilizado concurrente mente.`
              );
            }
          }

          let mappedMethod: any = p.method;
          if (p.method === 'CREDIT_CARD' || p.method === 'DEBIT_CARD')
            mappedMethod = 'CARD';
          if (p.method === 'PLIN') mappedMethod = 'TRANSFER';

          paymentsToCreate.push({
            posOrderId: order.id,
            method: mappedMethod,
            amount: amountToCharge,
            creditNoteId: creditNoteId,
          });
          remainingTotal -= amountToCharge;
        }

        await tx.payment.createMany({
          data: paymentsToCreate,
        });

        // D) Descontar Stock y Generar Kardex
        for (const item of items) {
          if (isTransfer) {
            // Venta cruzada: Reservar stock en origen
            // 1. Decrementar AVAILABLE
            await tx.branchStock.update({
              where: {
                variantId_branchId_status: {
                  variantId: item.variantId,
                  branchId: targetStockBranchId,
                  status: 'AVAILABLE',
                },
              },
              data: {
                quantity: {
                  decrement: item.quantity,
                },
              },
            });

            // 2. Incrementar RESERVED
            await tx.branchStock.upsert({
              where: {
                variantId_branchId_status: {
                  variantId: item.variantId,
                  branchId: targetStockBranchId,
                  status: 'RESERVED',
                },
              },
              create: {
                variantId: item.variantId,
                branchId: targetStockBranchId,
                quantity: item.quantity,
                status: 'RESERVED',
              },
              update: {
                quantity: {
                  increment: item.quantity,
                },
              },
            });

            // Nota: No se genera Kardex SALIDA hasta la confirmación física.
          } else {
            // Venta normal: Descontar stock disponible y generar Kardex
            await tx.branchStock.update({
              where: {
                variantId_branchId_status: {
                  variantId: item.variantId,
                  branchId: targetStockBranchId,
                  status: 'AVAILABLE',
                },
              },
              data: {
                quantity: {
                  decrement: item.quantity,
                },
              },
            });

            // Kardex
            const lastKardex = await tx.kardexEntry.findFirst({
              where: {
                variantId: item.variantId,
                branchId: targetStockBranchId,
              },
              orderBy: { id: 'desc' },
            });

            const currentUnitCost = lastKardex ? lastKardex.unitCost : 0;
            const currentBalanceQty = lastKardex ? lastKardex.balanceQty : 0;
            const newBalanceQty = currentBalanceQty - item.quantity;
            const currentBalanceCost = lastKardex ? lastKardex.balanceCost : 0;

            await tx.kardexEntry.create({
              data: {
                variantId: item.variantId,
                branchId: targetStockBranchId,
                type: 'VENTA',
                quantity: item.quantity,
                unitCost: currentUnitCost,
                balanceQty: newBalanceQty,
                balanceCost:
                  currentBalanceCost - item.quantity * currentUnitCost,
                userId: userId ?? null,
              },
            });
          }
        }

        // E) Calcular y otorgar puntos de fidelidad (HU-078)
        if (userId) {
          const loyaltyConfig = await tx.loyaltyConfig.findFirst({
            where: { isActive: true },
          });

          if (loyaltyConfig && loyaltyConfig.solesPerPoint) {
            const solesPerPoint = Number(loyaltyConfig.solesPerPoint);
            if (solesPerPoint > 0) {
              const pointsEarned = Math.floor(total / solesPerPoint);

              if (pointsEarned > 0) {
                await tx.loyaltyAccount.upsert({
                  where: { userId },
                  create: {
                    userId,
                    balance: pointsEarned,
                  },
                  update: {
                    balance: { increment: pointsEarned },
                  },
                });
              }
            }
          }
        }

        return order;
      });

      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('[SaleController] Error procesando venta:', error);
      return res.status(400).json({
        success: false,
        error: error.message || 'Error procesando la venta.',
      });
    }
  }

  /**
   * PATCH /api/v1/pos/sales/:id/cancel
   * Anula una venta y revierte el stock y kardex.
   * - ADMIN: puede anular directamente.
   * - SELLER: requiere credenciales de un administrador (adminEmail + adminPassword).
   */
  async cancelSale(req: Request, res: Response) {
    try {
      const orderId = parseInt(String(req.params.id), 10);
      if (isNaN(orderId)) {
        return res.status(400).json({
          success: false,
          error: 'El ID de la venta debe ser un número entero',
        });
      }

      const userId = req.auth?.userId;
      const userRole = req.auth?.role;
      if (!userId || !userRole) {
        return res
          .status(401)
          .json({ success: false, error: 'Usuario no autenticado' });
      }

      const { adminEmail, adminPassword } = req.body || {};

      const result = await cancelSaleUseCase.execute({
        orderId,
        userId,
        userRole,
        adminEmail,
        adminPassword,
      });

      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('[SaleController] Error anulando venta:', error);
      }

      if (error.message?.includes('no existe')) {
        return res.status(404).json({ success: false, error: error.message });
      }
      if (
        error.message?.includes('autorización') ||
        error.message?.includes('credenciales') ||
        error.message?.includes('administrador')
      ) {
        return res.status(403).json({ success: false, error: error.message });
      }
      if (error.message?.includes('Solo se pueden')) {
        return res.status(409).json({ success: false, error: error.message });
      }

      return res.status(500).json({
        success: false,
        error: error.message || 'Error al anular la venta.',
      });
    }
  }

  async getReceiptData(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const order = await prisma.posOrder.findUnique({
        where: { id: Number(id) },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: true,
                },
              },
            },
          },
          payments: true,
          branch: {
            select: {
              id: true,
              name: true,
              address: true,
              phone: true,
              igvExempt: true,
            },
          },
        },
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Orden de venta no encontrada.',
        });
      }

      // Fetch user separately because relation might not be defined in PosOrder schema
      let sellerName = 'Vendedor';
      if (order.userId) {
        const user = await prisma.user.findUnique({
          where: { id: order.userId },
          select: { name: true, lastName: true },
        });
        if (user) {
          sellerName = `${user.name} ${user.lastName || ''}`.trim();
        }
      }

      // Calculamos totales y organizamos datos para el recibo
      const totalPagado = order.payments.reduce(
        (sum: number, p: any) => sum + Number(p.amount),
        0
      );
      const efectivoTotal = order.payments
        .filter((p: any) => p.method === 'CASH')
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

      const change = Math.max(
        0,
        efectivoTotal - (Number(order.total) - (totalPagado - efectivoTotal))
      );

      return res.status(200).json({
        success: true,
        data: {
          orderId: order.id,
          date: order.createdAt,
          seller: sellerName,
          igvExempt: order.branch.igvExempt,
          branch: order.branch,
          documentType: order.documentType,
          series: order.series,
          correlative: order.correlative,
          items: order.items.map((item: any) => ({
            id: item.id,
            name: item.variant.product.name,
            sku: item.variant.sku,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            discountAmount: Number(item.discountAmount),
            lineTotal: Number(item.lineTotal),
            isCrossBranch: false,
          })),
          totals: {
            subtotal: Number(order.subtotal),
            discountTotal: Number(order.discountTotal),
            total: Number(order.total),
            paid: totalPagado,
            change: change,
          },
          payments: order.payments.map((p: any) => ({
            method: p.method,
            amount: Number(p.amount),
          })),
        },
      });
    } catch (error: any) {
      console.error('[SaleController] Error obteniendo recibo:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener el comprobante de venta.',
      });
    }
  }

  async confirmCrossBranch(req: Request, res: Response) {
    try {
      const orderId = parseInt(String(req.params.id), 10);
      if (isNaN(orderId)) {
        return res.status(400).json({
          success: false,
          error: 'El ID de la venta debe ser un número entero',
        });
      }

      const userId = req.auth?.userId;
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, error: 'Usuario no autenticado' });
      }

      const result = await confirmCrossBranchSaleUseCase.execute({
        orderId,
        userId,
      });
      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      console.error(
        '[SaleController] Error confirmando entrega cross-branch:',
        error
      );
      if (error.statusCode === 400) {
        return res.status(400).json({ success: false, error: error.message });
      }
      if (error.statusCode === 404) {
        return res.status(404).json({ success: false, error: error.message });
      }
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al confirmar la entrega.',
      });
    }
  }

  /**
   * GET /api/v1/pos/credit-notes/validate/:code
   * Validate a credit note for POS
   */
  async validateCreditNote(req: Request, res: Response) {
    try {
      const code = String(req.params.code);

      if (!code || code === 'undefined') {
        return res.status(400).json({
          success: false,
          error: 'Debe proporcionar el código del vale.',
        });
      }

      const creditNote = await prisma.creditNote.findUnique({
        where: { code },
      });

      if (!creditNote) {
        return res.status(404).json({
          success: false,
          error: `El vale de crédito con código ${code} no existe.`,
        });
      }

      if (creditNote.type !== 'STORE_CREDIT') {
        return res.status(400).json({
          success: false,
          error: `El código proporcionado no es un saldo a favor válido para canjear en tienda.`,
        });
      }

      if (creditNote.usedAt !== null) {
        return res.status(400).json({
          success: false,
          error: `El vale de crédito ${code} ya fue utilizado el ${creditNote.usedAt.toLocaleDateString()}.`,
        });
      }

      // TODO: If credit notes expire, we would check expiration date here

      return res.status(200).json({
        success: true,
        data: {
          code: creditNote.code,
          amount: Number(creditNote.amount),
        },
      });
    } catch (error: any) {
      console.error('[SaleController] Error validando vale de crédito:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error interno al validar el vale de crédito.',
      });
    }
  }
}
