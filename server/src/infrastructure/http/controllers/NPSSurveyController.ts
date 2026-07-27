import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '@infrastructure/database/prisma';

const AnswerSurveySchema = z.object({
  score: z.number().int().min(0).max(10),
  comment: z.string().max(500).optional(),
});

export class NPSSurveyController {
  async getByToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.params.token as string;

      const survey = await prisma.nPSSurvey.findUnique({
        where: { token },
        include: {
          user: { select: { name: true, email: true } },
          order: { select: { id: true, createdAt: true } },
          client: { select: { name: true, email: true } },
          posOrder: { select: { id: true, createdAt: true } },
        },
      });

      if (!survey) {
        return res.status(404).json({
          success: false,
          error: 'Encuesta no encontrada o token inválido',
        });
      }

      if (survey.answeredAt) {
        return res
          .status(400)
          .json({ success: false, error: 'Esta encuesta ya fue respondida' });
      }

      const isPOS = survey.channel === 'POS';

      return res.status(200).json({
        success: true,
        data: {
          userName: isPOS ? survey.client?.name : survey.user?.name,
          orderId: isPOS ? survey.posOrder?.id : survey.order?.id,
          orderDate: isPOS
            ? survey.posOrder?.createdAt
            : survey.order?.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async answer(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.params.token as string;

      const validation = AnswerSurveySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          errors: validation.error.issues,
        });
      }

      const survey = await prisma.nPSSurvey.findUnique({ where: { token } });

      if (!survey) {
        return res.status(404).json({
          success: false,
          error: 'Encuesta no encontrada o token inválido',
        });
      }

      if (survey.answeredAt) {
        return res
          .status(400)
          .json({ success: false, error: 'Esta encuesta ya fue respondida' });
      }

      await prisma.nPSSurvey.update({
        where: { token },
        data: {
          score: validation.data.score,
          comment: validation.data.comment,
          answeredAt: new Date(),
        },
      });

      return res.status(200).json({
        success: true,
        message: '¡Gracias por tus comentarios!',
      });
    } catch (error) {
      next(error);
    }
  }
}
