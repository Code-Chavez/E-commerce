import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '@infrastructure/database/prisma';

// Helper to calculate cart totals and return consistent structure
async function formatCartResponse(cart: any) {
  if (!cart) return null;
  
  let subtotal = 0;
  
  const formattedItems = cart.items.map((item: any) => {
    const itemPrice = Number(item.variant.price);
    const itemDiscount = item.variant.discountPercent;
    
    // Calcular el precio final considerando el descuento
    const finalPrice = itemDiscount > 0 
      ? itemPrice - (itemPrice * itemDiscount) / 100 
      : itemPrice;
      
    const totalItemPrice = finalPrice * item.quantity;
    subtotal += totalItemPrice;
    
    return {
      id: item.id,
      cartId: item.cartId,
      variantId: item.variantId,
      quantity: item.quantity,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      variant: {
        id: item.variant.id,
        productId: item.variant.productId,
        sku: item.variant.sku,
        price: itemPrice,
        discountPercent: itemDiscount,
        finalPrice,
        product: item.variant.product,
        stock: item.variant.branchStock?.reduce((sum: number, bs: any) => sum + bs.quantity, 0) || 0,
      }
    };
  });

  return {
    id: cart.id,
    userId: cart.userId,
    sessionId: cart.sessionId,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
    items: formattedItems,
    subtotal
  };
}

export class CartController {
  
  // GET /api/v1/cart
  async getCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth?.userId;
      const sessionId = req.headers['x-session-id'] as string;

      if (!userId && !sessionId) {
        return res.status(200).json({ success: true, data: null });
      }

      // Buscar por userId si está autenticado, sino por sessionId
      const cart = await prisma.cart.findFirst({
        where: userId ? { userId } : { sessionId },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    include: { images: true }
                  },
                  branchStock: true
                }
              }
            }
          }
        }
      });

      return res.status(200).json({
        success: true,
        data: await formatCartResponse(cart)
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/cart/items
  async addItem(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = z.object({
        variantId: z.number().int().positive(),
        quantity: z.number().int().positive().default(1)
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: 'Datos inválidos' });
      }

      const { variantId, quantity } = parsed.data;
      const userId = req.auth?.userId;
      const sessionId = req.headers['x-session-id'] as string;

      if (!userId && !sessionId) {
        return res.status(400).json({ success: false, error: 'Falta sessionId o autenticación' });
      }

      // Validar que la variante exista
      const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
      if (!variant) {
        return res.status(404).json({ success: false, error: 'Variante no encontrada' });
      }

      // 1. Encontrar o crear el carrito
      let cart = await prisma.cart.findFirst({
        where: userId ? { userId } : { sessionId }
      });

      if (!cart) {
        cart = await prisma.cart.create({
          data: userId ? { userId } : { sessionId }
        });
      }

      // 2. Comprobar si el ítem ya existe en el carrito
      const existingItem = await prisma.cartItem.findUnique({
        where: {
          cartId_variantId: { cartId: cart.id, variantId }
        }
      });

      if (existingItem) {
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + quantity }
        });
      } else {
        await prisma.cartItem.create({
          data: { cartId: cart.id, variantId, quantity }
        });
      }

      // 3. Devolver el carrito actualizado
      const updatedCart = await prisma.cart.findUnique({
        where: { id: cart.id },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: { include: { images: true } },
                  branchStock: true
                }
              }
            }
          }
        }
      });

      return res.status(200).json({
        success: true,
        data: await formatCartResponse(updatedCart)
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/v1/cart/items/:id
  async updateItem(req: Request, res: Response, next: NextFunction) {
    try {
      const itemId = parseInt(req.params.id as string, 10);
      const schema = z.object({
        quantity: z.number().int().positive()
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: 'Cantidad inválida' });
      }

      const { quantity } = parsed.data;

      // Actualizar el ítem
      const item = await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity }
      });

      // Retornar el carrito actualizado
      const cart = await prisma.cart.findUnique({
        where: { id: item.cartId },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: { include: { images: true } },
                  branchStock: true
                }
              }
            }
          }
        }
      });

      return res.status(200).json({
        success: true,
        data: await formatCartResponse(cart)
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/v1/cart/items/:id
  async removeItem(req: Request, res: Response, next: NextFunction) {
    try {
      const itemId = parseInt(req.params.id as string, 10);

      const item = await prisma.cartItem.findUnique({ where: { id: itemId } });
      if (!item) {
        return res.status(404).json({ success: false, error: 'Ítem no encontrado' });
      }

      await prisma.cartItem.delete({ where: { id: itemId } });

      // Retornar carrito actualizado
      const cart = await prisma.cart.findUnique({
        where: { id: item.cartId },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: { include: { images: true } },
                  branchStock: true
                }
              }
            }
          }
        }
      });

      return res.status(200).json({
        success: true,
        data: await formatCartResponse(cart)
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/cart/merge
  async mergeCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth?.userId;
      const sessionId = req.headers['x-session-id'] as string;

      if (!userId || !sessionId) {
        return res.status(400).json({ success: false, error: 'Se requiere userId y sessionId' });
      }

      const anonymousCart = await prisma.cart.findUnique({
        where: { sessionId },
        include: { items: true }
      });

      let userCart = await prisma.cart.findFirst({
        where: { userId },
        include: { items: true }
      });

      // Si no hay carrito anónimo o no tiene ítems, devolver carrito de usuario
      if (!anonymousCart || anonymousCart.items.length === 0) {
        if (!userCart) return res.status(200).json({ success: true, data: null });
        
        const cartFull = await prisma.cart.findUnique({
          where: { id: userCart.id },
          include: {
            items: {
              include: {
                variant: {
                  include: { product: { include: { images: true } }, branchStock: true }
                }
              }
            }
          }
        });
        return res.status(200).json({ success: true, data: await formatCartResponse(cartFull) });
      }

      // Si no existe carrito de usuario, simplemente asignamos el anónimo al usuario
      if (!userCart) {
        await prisma.cart.update({
          where: { id: anonymousCart.id },
          data: { userId, sessionId: null } // Le quitamos el sessionId para que ya sea 100% del usuario
        });
        userCart = anonymousCart;
      } else {
        // Fusionar: Mover ítems del anónimo al usuario
        for (const anonItem of anonymousCart.items) {
          const existingUserItem = userCart.items.find(i => i.variantId === anonItem.variantId);
          if (existingUserItem) {
            await prisma.cartItem.update({
              where: { id: existingUserItem.id },
              data: { quantity: existingUserItem.quantity + anonItem.quantity }
            });
          } else {
            await prisma.cartItem.update({
              where: { id: anonItem.id },
              data: { cartId: userCart.id }
            });
          }
        }
        // Borrar el carrito anónimo vacío
        await prisma.cart.delete({ where: { id: anonymousCart.id } });
      }

      const updatedUserCart = await prisma.cart.findUnique({
        where: { id: userCart.id },
        include: {
          items: {
            include: {
              variant: {
                include: { product: { include: { images: true } }, branchStock: true }
              }
            }
          }
        }
      });

      return res.status(200).json({
        success: true,
        data: await formatCartResponse(updatedUserCart)
      });
    } catch (error) {
      next(error);
    }
  }
}
