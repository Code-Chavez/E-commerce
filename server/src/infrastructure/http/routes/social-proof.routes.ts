import { Router } from 'express';
import multer from 'multer';
import {
  getSocialProofs,
  getAdminSocialProofs,
  createSocialProof,
  approveSocialProof,
  deleteSocialProof
} from '../controllers/SocialProofController';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// Configuracin de Multer para subir la foto
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite de 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imǭgenes.'));
    }
  },
});

// Rutas pǭblicas
router.get('/', getSocialProofs);

// Rutas de administracin
router.get('/admin', requireAuth, getAdminSocialProofs);
router.post('/admin', requireAuth, upload.single('image'), createSocialProof);
router.patch('/admin/:id/approve', requireAuth, approveSocialProof);
router.delete('/admin/:id', requireAuth, deleteSocialProof);

export default router;
