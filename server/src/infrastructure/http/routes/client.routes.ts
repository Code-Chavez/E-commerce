import { Router } from 'express';
import { ClientController } from '@infrastructure/http/controllers/ClientController';
import { RFMSegmentsController } from '@infrastructure/http/controllers/RFMSegmentsController';
import { requirePermission } from '@infrastructure/http/middlewares/auth.middleware';

const router = Router();
const clientController = new ClientController();
const rfmController = new RFMSegmentsController();

/**
 * T-205: List unified clients base
 */
router.get(
  '/admin/clients',
  requirePermission('users:read'),
  clientController.getUnifiedClients.bind(clientController)
);

/**
 * T-059 helper: List clients without account
 */
router.get(
  '/admin/clients/unlinked',
  requirePermission('users:read'),
  clientController.getUnlinkedClients.bind(clientController)
);

/**
 * T-057: Link single client
 */
router.post(
  '/admin/clients/:id/link',
  requirePermission('users:write'),
  clientController.linkClient.bind(clientController)
);

/**
 * T-058: Bulk link clients
 */
router.post(
  '/admin/clients/bulk-link',
  requirePermission('users:write'),
  clientController.bulkLink.bind(clientController)
);

/**
 * T-206: Update client details
 */
router.put(
  '/admin/clients/:id',
  requirePermission('users:write'),
  clientController.updateClient.bind(clientController)
);

// T-268: Segmentación RFM de clientes (HU-083)
router.get(
  '/admin/clients/rfm-segments',
  requirePermission('users:read'),
  rfmController.getSegments,
);

// T-269: Envío de campaña por segmento RFM (HU-083)
router.post(
  '/admin/clients/rfm-segments/:segment/campaign',
  requirePermission('users:read'),
  rfmController.sendCampaign,
);

// T-284 / HU-089: Historial de comunicaciones
router.get(
  '/admin/clients/:id/communications',
  requirePermission('users:read'),
  clientController.getClientCommunications.bind(clientController)
);


export default router;
