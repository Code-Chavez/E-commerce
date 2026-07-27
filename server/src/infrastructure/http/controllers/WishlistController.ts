import { Request, Response } from 'express';
import prisma from '@infrastructure/database/prisma';

export class WishlistController {
  
  public static async getWishlist(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'No autorizado' });
        return;
      }

      const wishlist = await prisma.wishlist.findMany({
        where: { userId },
        include: {
          variant: {
            include: {
              product: {
                include: {
                  images: true,
                  variants: {
                    include: {
                      branchStock: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { addedAt: 'desc' }
      });

      res.status(200).json({ success: true, data: wishlist });
    } catch (error) {
      console.error('[WishlistController.getWishlist] Error:', error);
      res.status(500).json({ success: false, error: 'Error al obtener la lista de favoritos' });
    }
  }

  public static async toggleWishlistItem(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'No autorizado' });
        return;
      }

      const variantIdStr = req.params.variantId;
      const variantId = parseInt(Array.isArray(variantIdStr) ? variantIdStr[0] : variantIdStr, 10);
      if (isNaN(variantId)) {
        res.status(400).json({ success: false, error: 'ID de variante inválido' });
        return;
      }

      // Check if variant exists
      const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
      if (!variant) {
        res.status(404).json({ success: false, error: 'Variante no encontrada' });
        return;
      }

      // Toggle logic
      const existing = await prisma.wishlist.findUnique({
        where: { userId_variantId: { userId, variantId } }
      });

      if (existing) {
        // Remove from wishlist
        await prisma.wishlist.delete({
          where: { id: existing.id }
        });
        res.status(200).json({ success: true, message: 'Producto eliminado de favoritos', added: false });
      } else {
        // Add to wishlist
        await prisma.wishlist.create({
          data: { userId, variantId }
        });
        res.status(201).json({ success: true, message: 'Producto agregado a favoritos', added: true });
      }
    } catch (error) {
      console.error('[WishlistController.toggleWishlistItem] Error:', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor al modificar favoritos' });
    }
  }

}
