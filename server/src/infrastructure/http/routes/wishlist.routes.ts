import { Router } from 'express';
import { WishlistController } from '../controllers/WishlistController';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// Todos los endpoints de wishlist requieren autenticación
router.use(requireAuth);

// GET /api/v1/wishlist - Lista de favoritos del usuario
router.get('/', WishlistController.getWishlist);

// POST/DELETE /api/v1/wishlist/:variantId - Agrega o quita un favorito (toggle)
router.post('/:variantId', WishlistController.toggleWishlistItem);
router.delete('/:variantId', WishlistController.toggleWishlistItem);

export default router;
