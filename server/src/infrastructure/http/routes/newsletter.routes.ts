import { Router } from 'express';
import { NewsletterController } from '../controllers/NewsletterController';

const router = Router();
const controller = new NewsletterController();

router.post('/newsletter/subscribe', controller.subscribe.bind(controller));
router.delete(
  '/newsletter/unsubscribe',
  controller.unsubscribe.bind(controller)
);

export default router;
