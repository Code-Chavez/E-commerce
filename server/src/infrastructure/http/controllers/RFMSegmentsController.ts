import { Request, Response, NextFunction } from 'express';
import {
  GetRFMSegmentsUseCase,
  RFMSegment,
} from '@application/use-cases/admin/GetRFMSegmentsUseCase';
import { SendRFMCampaignUseCase } from '@application/use-cases/admin/SendRFMCampaignUseCase';

const VALID_SEGMENTS: RFMSegment[] = [
  'Champions',
  'Loyal',
  'At Risk',
  'Lost',
  'Promising',
];

const getUseCase = new GetRFMSegmentsUseCase();
const sendUseCase = new SendRFMCampaignUseCase();

export class RFMSegmentsController {
  getSegments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { segment } = req.query;
      const parsedSegment = segment
        ? (String(segment) as RFMSegment)
        : undefined;

      if (parsedSegment && !VALID_SEGMENTS.includes(parsedSegment)) {
        res.status(400).json({
          success: false,
          error: `Segmento inválido. Opciones: ${VALID_SEGMENTS.join(', ')}`,
        });
        return;
      }

      const report = await getUseCase.execute(parsedSegment);
      res.status(200).json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  };

  sendCampaign = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { segment } = req.params;
      const { subject, body } = req.body;

      if (!VALID_SEGMENTS.includes(segment as RFMSegment)) {
        res.status(400).json({
          success: false,
          error: `Segmento inválido. Opciones: ${VALID_SEGMENTS.join(', ')}`,
        });
        return;
      }

      if (!subject || !body) {
        res.status(400).json({
          success: false,
          error: 'Los campos subject y body son requeridos',
        });
        return;
      }

      const result = await sendUseCase.execute(
        segment as RFMSegment,
        String(subject),
        String(body)
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };
}
