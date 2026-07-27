import { Router } from 'express';
import { NPSSurveyController } from '@infrastructure/http/controllers/NPSSurveyController';

const router = Router();
const npsController = new NPSSurveyController();

/**
 * HU-086: GET /nps/:token
 * Verifica si el token de encuesta es válido y obtiene información básica de la orden.
 */
router.get('/:token', npsController.getByToken.bind(npsController));

/**
 * HU-086: POST /nps/:token
 * Registra la respuesta (score y comment) a la encuesta NPS.
 */
router.post('/:token', npsController.answer.bind(npsController));

export default router;
