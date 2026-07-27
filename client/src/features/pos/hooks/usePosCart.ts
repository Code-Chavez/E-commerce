import { useState, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import type { PosProduct, CartItem } from '../types/pos.types';

export const usePosCart = (igvExempt = false) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Add item to cart with strict stock validation
  const addItem = useCallback((product: PosProduct, quantity = 1) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.variantId === product.variantId);
      const currentQty = existingItem ? existingItem.quantity : 0;
      const newQty = currentQty + quantity;

      if (product.stock > 0 && newQty > product.stock) {
        toast.error(`Stock insuficiente. Solo quedan ${product.stock} unidades de "${product.name}"`);
        return prevItems;
      }

      if (product.stock <= 0 && newQty > 1) {
        toast.error(`Stock insuficiente en sucursal local. Máximo 1 unidad para consulta/venta cruzada.`);
        return prevItems;
      }

      if (existingItem) {
        toast.success(`Cantidad actualizada para "${product.name}" (+${quantity})`);
        return prevItems.map((item) =>
          item.variantId === product.variantId ? { ...item, quantity: newQty } : item
        );
      }

      toast.success(`"${product.name}" agregado al carrito`);
      return [
        ...prevItems,
        {
          variantId: product.variantId,
          productId: product.productId,
          sku: product.sku,
          name: product.name,
          price: product.price,
          quantity,
          stock: product.stock,
          attributes: product.attributes,
        },
      ];
    });
  }, []);

  // Update item quantity directly
  const updateQty = useCallback((variantId: number, newQty: number) => {
    if (newQty <= 0) {
      setCartItems((prevItems) => prevItems.filter((item) => item.variantId !== variantId));
      toast.success('Producto eliminado del carrito');
      return;
    }

    setCartItems((prevItems) => {
      const targetItem = prevItems.find((item) => item.variantId === variantId);
      if (!targetItem) return prevItems;

      if (targetItem.stock > 0 && newQty > targetItem.stock) {
        toast.error(`Stock insuficiente. Solo quedan ${targetItem.stock} unidades en almacén`);
        return prevItems;
      }

      if (targetItem.stock <= 0 && newQty > 1) {
        toast.error(`Stock insuficiente en sucursal local. Máximo 1 unidad para consulta/venta cruzada.`);
        return prevItems;
      }

      return prevItems.map((item) =>
        item.variantId === variantId ? { ...item, quantity: newQty } : item
      );
    });
  }, []);

  // Remove item completely from cart
  const removeItem = useCallback((variantId: number) => {
    setCartItems((prevItems) => {
      const target = prevItems.find((item) => item.variantId === variantId);
      if (target) {
        toast.success(`"${target.name}" eliminado del carrito`);
      }
      return prevItems.filter((item) => item.variantId !== variantId);
    });
  }, []);

  // Clear all items in cart
  const clearCart = useCallback(() => {
    setCartItems([]);
    toast.success('Carrito de ventas vaciado');
  }, []);

  // Calculated totals
  const totals = useMemo(() => {
    const grossTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    // Branches in IGV-exempt zones (e.g. Amazonas/Selva, Ley 27037) sell at face value —
    // prices do not embed IGV, so subtotal = gross total and tax = 0.
    if (igvExempt) {
      return {
        subtotal: parseFloat(grossTotal.toFixed(2)),
        tax: 0,
        total: parseFloat(grossTotal.toFixed(2)),
        itemCount: cartItems.reduce((acc, item) => acc + item.quantity, 0),
      };
    }

    const taxRate = 0.18;
    const cleanSubtotal = grossTotal / (1 + taxRate);
    const tax = grossTotal - cleanSubtotal;

    return {
      subtotal: parseFloat(cleanSubtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      total: parseFloat(grossTotal.toFixed(2)),
      itemCount: cartItems.reduce((acc, item) => acc + item.quantity, 0),
    };
  }, [cartItems, igvExempt]);

  return {
    cartItems,
    addItem,
    updateQty,
    removeItem,
    clearCart,
    totals,
  };
};
