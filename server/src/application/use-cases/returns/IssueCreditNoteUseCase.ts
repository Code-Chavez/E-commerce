import prisma from '@infrastructure/database/prisma';
import { requestContext } from '@infrastructure/context/RequestContext';
import { ICreditNoteRepository } from '@domain/repositories/ICreditNoteRepository';
import { IPdfGenerator } from '@domain/ports/IPdfGenerator';
import { IEmailSender } from '@domain/ports/IEmailSender';
import { CreditNote } from '@domain/entities/CreditNote';

export class IssueCreditNoteUseCase {
  constructor(
    private readonly creditNoteRepository: ICreditNoteRepository,
    private readonly pdfGenerator: IPdfGenerator,
    private readonly emailSender: IEmailSender
  ) {}

  async execute(returnRequestId: number): Promise<CreditNote> {
    // 1. Fetch ReturnRequest with related items and order details
    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id: returnRequestId },
      include: {
        items: {
          include: {
            orderItem: {
              include: {
                variant: {
                  include: {
                    product: true
                  }
                }
              }
            }
          }
        },
        user: true,
      },
    });

    if (!returnRequest) {
      throw new Error(`Return request with ID ${returnRequestId} not found`);
    }

    // 2. Check if a CreditNote already exists
    const existingCreditNote = await this.creditNoteRepository.findByReturnRequestId(returnRequestId);
    if (existingCreditNote) {
      throw new Error(`A credit note has already been issued for return request ID ${returnRequestId}`);
    }

    // 3. Calculate amount
    const amount = returnRequest.items.reduce((sum, item) => {
      const price = Number(item.orderItem.unitPrice);
      return sum + (item.qty * price);
    }, 0);

    if (amount <= 0) {
      throw new Error('Return request has an invalid total amount of 0 or less');
    }

    // Generate unique code
    const uniqueCode = `NC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 4. Atomic transaction: Stock + Kardex + DB Persistence
    const creditNote = await prisma.$transaction(async (tx) => {
      // Find main branch for stock reincorporation
      let mainBranch = await tx.branch.findFirst({
        where: { isMain: true, isActive: true }
      });

      if (!mainBranch) {
        mainBranch = await tx.branch.findFirst({
          where: { isActive: true },
          orderBy: { id: 'asc' }
        });
      }

      if (!mainBranch) {
        throw new Error('No active branch found for stock reincorporation');
      }

      // Revert stock and update Kardex for each item
      for (const item of returnRequest.items) {
        const variantId = item.orderItem.variantId;
        const qty = item.qty;

        let stock = await tx.branchStock.findUnique({
          where: {
            variantId_branchId_status: {
              variantId,
              branchId: mainBranch.id,
              status: 'AVAILABLE'
            }
          }
        });

        if (!stock) {
          stock = await tx.branchStock.create({
            data: {
              variantId,
              branchId: mainBranch.id,
              status: 'AVAILABLE',
              quantity: 0
            }
          });
        }

        const newQty = Number(stock.quantity) + qty;

        await tx.branchStock.update({
          where: { id: stock.id },
          data: { quantity: newQty }
        });

        // Get last Kardex entry to preserve unit cost
        const lastKardex = await tx.kardexEntry.findFirst({
          where: { variantId, branchId: mainBranch.id },
          orderBy: { id: 'desc' }
        });

        const unitCost = lastKardex?.unitCost ?? 0;
        const lastBalanceCost = lastKardex?.balanceCost ?? 0;
        const newBalanceCost = lastBalanceCost + (qty * unitCost);

        await tx.kardexEntry.create({
          data: {
            variantId,
            branchId: mainBranch.id,
            type: 'DEVOLUCION',
            quantity: qty,
            unitCost,
            balanceQty: newQty,
            balanceCost: newBalanceCost,
            userId: requestContext.getStore()?.userId ?? null
          }
        });
      }

      // Update ReturnRequest status to APPROVED
      await tx.returnRequest.update({
        where: { id: returnRequestId },
        data: { status: 'APPROVED' }
      });

      // Update Order status to RETURNED
      await tx.order.update({
        where: { id: returnRequest.orderId },
        data: { status: 'RETURNED' }
      });

      // Create credit note in DB
      const createdNote = await this.creditNoteRepository.create({
        returnRequestId,
        amount,
        type: returnRequest.refundType,
        code: uniqueCode,
      }, tx);

      return createdNote;
    }, { maxWait: 10000, timeout: 20000 });

    // 5. Generate PDF and send via Resend (Outside of the DB transaction to avoid long-running locks!)
    try {
      const pdfBuffer = await this.pdfGenerator.generateCreditNotePdf({
        creditNoteCode: creditNote.code,
        amount: creditNote.amount,
        type: creditNote.type,
        clientName: returnRequest.user.name || '',
        clientEmail: returnRequest.user.email,
        items: returnRequest.items.map(item => ({
          name: item.orderItem.variant.product.name,
          qty: item.qty,
          unitPrice: Number(item.orderItem.unitPrice)
        })),
        createdAt: creditNote.createdAt
      });

      const emailHtml = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>Nota de Crédito Emitida</h2>
          <p>Estimado/a ${returnRequest.user.name},</p>
          <p>Le informamos que se ha emitido una nueva nota de crédito por su devolución.</p>
          <ul>
            <li><strong>Código:</strong> ${creditNote.code}</li>
            <li><strong>Monto:</strong> $${creditNote.amount.toFixed(2)}</li>
            <li><strong>Tipo:</strong> ${creditNote.type === 'STORE_CREDIT' ? 'Saldo a favor en tienda' : 'Nota de crédito'}</li>
          </ul>
          <p>Adjunto a este correo encontrará el documento PDF de la nota de crédito correspondiente.</p>
          <br/>
          <p>Atentamente,<br/>El equipo de DMendoza</p>
        </div>
      `;

      await this.emailSender.sendEmailWithAttachment({
        to: returnRequest.user.email,
        subject: `Dmendoza - Nota de Crédito ${creditNote.code}`,
        html: emailHtml,
        attachmentName: `Nota_de_Credito_${creditNote.code}.pdf`,
        attachmentBuffer: pdfBuffer
      });
    } catch (emailError) {
      console.error('Failed to generate PDF or send email:', emailError);
    }

    return creditNote;
  }
}
