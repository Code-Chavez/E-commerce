import { Router } from 'express';
import multer from 'multer';
import { ProfileController } from '@infrastructure/http/controllers/ProfileController';
import { requireAuth } from '@infrastructure/http/middlewares/auth.middleware';

const router = Router();
const profileController = new ProfileController();

// Multer memory storage configuration with validation filters
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Restrict mimetypes to safe images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Formato de archivo inválido. Solo se admiten imágenes.'));
    }
  },
});

/**
 * HU-005: GET /profile
 * Retrieves customer profile details.
 */
router.get(
  '/profile',
  requireAuth,
  profileController.get.bind(profileController)
);

/**
 * HU-005: PATCH /profile
 * Updates customer profile details and profile picture (avatar).
 */
router.patch(
  '/profile',
  requireAuth,
  upload.single('avatar'),
  profileController.update.bind(profileController)
);

/**
 * HU-080: PATCH /profile/preferences
 * Updates customer purchase preferences.
 */
router.patch(
  '/profile/preferences',
  requireAuth,
  profileController.updatePreferences.bind(profileController)
);

export default router;
