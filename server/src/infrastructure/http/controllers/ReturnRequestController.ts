import { Request, Response, NextFunction } from 'express';
import prisma from '@infrastructure/database/prisma';
import { CreateReturnRequestUseCase } from '@application/use-cases/returns/CreateReturnRequestUseCase';
import { ApproveReturnRequestUseCase } from '@application/use-cases/returns/ApproveReturnRequestUseCase';
import { GetAdminReturnRequestsUseCase } from '@application/use-cases/returns/GetAdminReturnRequestsUseCase';
import { RejectReturnRequestUseCase } from '@application/use-cases/returns/RejectReturnRequestUseCase';
import { IssueCreditNoteUseCase } from '@application/use-cases/returns/IssueCreditNoteUseCase';
import { PrismaReturnRequestRepository } from '@infrastructure/database/repositories/PrismaReturnRequestRepository';
import { PrismaOrderRepository } from '@infrastructure/database/repositories/PrismaOrderRepository';
import { PrismaCreditNoteRepository } from '@infrastructure/database/repositories/PrismaCreditNoteRepository';
import { PrismaDeliveryRepository } from '@infrastructure/database/repositories/PrismaDeliveryRepository';
import { PdfGeneratorAdapter } from '@infrastructure/adapters/PdfGeneratorAdapter';
import { ResendEmailSenderAdapter } from '@infrastructure/adapters/ResendEmailSenderAdapter';

export class ReturnRequestController {
  private createReturnRequestUseCase: CreateReturnRequestUseCase;
  private approveReturnRequestUseCase: ApproveReturnRequestUseCase;
  private rejectReturnRequestUseCase: RejectReturnRequestUseCase;
  private issueCreditNoteUseCase: IssueCreditNoteUseCase;
  private getAdminReturnRequestsUseCase: GetAdminReturnRequestsUseCase;
  private creditNoteRepo: PrismaCreditNoteRepository;
  private pdfGenerator: PdfGeneratorAdapter;
  private emailSender: ResendEmailSenderAdapter;

  constructor() {
    const returnRequestRepo = new PrismaReturnRequestRepository();
    const orderRepo = new PrismaOrderRepository();
    const deliveryRepo = new PrismaDeliveryRepository();
    this.creditNoteRepo = new PrismaCreditNoteRepository();
    this.pdfGenerator = new PdfGeneratorAdapter();
    this.emailSender = new ResendEmailSenderAdapter();

    this.createReturnRequestUseCase = new CreateReturnRequestUseCase(returnRequestRepo, orderRepo);
    this.approveReturnRequestUseCase = new ApproveReturnRequestUseCase(returnRequestRepo, deliveryRepo);
    this.rejectReturnRequestUseCase = new RejectReturnRequestUseCase(returnRequestRepo);
    this.issueCreditNoteUseCase = new IssueCreditNoteUseCase(this.creditNoteRepo, this.pdfGenerator, this.emailSender);
    this.getAdminReturnRequestsUseCase = new GetAdminReturnRequestsUseCase(returnRequestRepo);
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized: User ID not found' });
        return;
      }

      const { orderId, reason, refundType, items } = req.body;

      const returnRequest = await this.createReturnRequestUseCase.execute({
        orderId,
        userId,
        reason,
        refundType,
        items,
      });

      res.status(201).json({ success: true, data: returnRequest });
    } catch (error: any) {
      if (
        error.message?.includes('not found') ||
        error.message?.includes('authorized') ||
        error.message?.includes('Only delivered') ||
        error.message?.includes('exceeds') ||
        error.message?.includes('Invalid return quantity')
      ) {
        res.status(400).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  };

  approve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: 'Invalid ID parameter' });
        return;
      }

      const returnRequest = await this.approveReturnRequestUseCase.execute(id);
      res.status(200).json({ success: true, data: returnRequest });
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      if (error.message?.includes('already')) {
        res.status(400).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  };

  reject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: 'Invalid ID parameter' });
        return;
      }

      const returnRequest = await this.rejectReturnRequestUseCase.execute(id);
      res.status(200).json({ success: true, data: returnRequest });
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      if (error.message?.includes('already')) {
        res.status(400).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  };

  issueCreditNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: 'Invalid ID parameter' });
        return;
      }

      const creditNote = await this.issueCreditNoteUseCase.execute(id);
      res.status(201).json({ success: true, data: creditNote });
    } catch (error: any) {
      if (
        error.message?.includes('not found') ||
        error.message?.includes('already been issued') ||
        error.message?.includes('invalid total amount')
      ) {
        res.status(400).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const returnRequests = await this.getAdminReturnRequestsUseCase.execute();
      res.status(200).json({ success: true, data: returnRequests });
    } catch (error) {
      next(error);
    }
  };

  listCreditNotes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const creditNotes = await this.creditNoteRepo.findAll();
      res.status(200).json({ success: true, data: creditNotes });
    } catch (error) {
      next(error);
    }
  };

  resendCreditNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ success: false, error: 'Invalid ID parameter' });
        return;
      }

      const creditNote = await prisma.creditNote.findUnique({
        where: { id },
        include: {
          returnRequest: {
            include: {
              items: {
                include: {
                  orderItem: {
                    include: {
                      variant: {
                        include: {
                          product: true,
                        },
                      },
                    },
                  },
                },
              },
              user: true,
            },
          },
        },
      });

      if (!creditNote) {
        res.status(404).json({ success: false, error: 'Credit note not found' });
        return;
      }

      const returnRequest = creditNote.returnRequest;
      if (!returnRequest) {
        res.status(400).json({ success: false, error: 'Associated return request not found' });
        return;
      }

      const pdfBuffer = await this.pdfGenerator.generateCreditNotePdf({
        creditNoteCode: creditNote.code,
        amount: creditNote.amount,
        type: creditNote.type as any,
        clientName: returnRequest.user.name || '',
        clientEmail: returnRequest.user.email,
        items: returnRequest.items.map((item) => ({
          name: item.orderItem.variant.product.name,
          qty: item.qty,
          unitPrice: Number(item.orderItem.unitPrice),
        })),
        createdAt: creditNote.createdAt,
      });

      const emailHtml = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>Nota de Crédito Reenviada</h2>
          <p>Estimado/a ${returnRequest.user.name},</p>
          <p>Le reenviamos el documento PDF de su nota de crédito por su devolución.</p>
          <ul>
            <li><strong>Código:</strong> ${creditNote.code}</li>
            <li><strong>Monto:</strong> $${creditNote.amount.toFixed(2)}</li>
            <li><strong>Tipo:</strong> ${creditNote.type === 'STORE_CREDIT' ? 'Saldo a favor en tienda' : 'Nota de crédito'}</li>
          </ul>
          <p>Adjunto a este correo encontrará el documento PDF correspondiente.</p>
          <br/>
          <p>Atentamente,<br/>El equipo de DMendoza</p>
        </div>
      `;

      await this.emailSender.sendEmailWithAttachment({
        to: returnRequest.user.email,
        subject: `Dmendoza - Reenvío Nota de Crédito ${creditNote.code}`,
        html: emailHtml,
        attachmentName: `Nota_de_Credito_${creditNote.code}.pdf`,
        attachmentBuffer: pdfBuffer,
      });

      res.status(200).json({ success: true, message: `Credit note PDF resent successfully to ${returnRequest.user.email}` });
    } catch (error) {
      next(error);
    }
  };
}
