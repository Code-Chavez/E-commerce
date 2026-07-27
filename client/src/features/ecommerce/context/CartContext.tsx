import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { getApiUrl } from '@/shared/config/env';
import type { Cart } from '../types';

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  fetchCart: () => Promise<void>;
  addItem: (variantId: number, quantity?: number) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  mergeCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper para asegurar el SessionID
const getSessionId = () => {
  let sessionId = localStorage.getItem('cart_session_id');
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem('cart_session_id', sessionId);
  }
  return sessionId;
};

// API Client
const api = axios.create({
  baseURL: `${getApiUrl()}/v1`,
  withCredentials: true,
});

// Interceptor para inyectar token y sessionId
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['X-Session-ID'] = getSessionId();
  return config;
});

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const fetchCart = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/cart');
      if (data.success) {
        setCart(data.data);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = async (variantId: number, quantity = 1) => {
    try {
      setIsLoading(true);
      const { data } = await api.post('/cart/items', { variantId, quantity });
      if (data.success) {
        setCart(data.data);
        openCart(); // Abrimos el drawer al añadir
      }
    } catch (error) {
      console.error('Error adding item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateItem = async (itemId: number, quantity: number) => {
    const previousCart = cart;
    if (cart) {
      setCart({
        ...cart,
        items: cart.items.map(item => item.id === itemId ? { ...item, quantity } : item),
      });
    }
    try {
      const { data } = await api.patch(`/cart/items/${itemId}`, { quantity });
      if (data.success) {
        setCart(data.data);
      }
    } catch (error) {
      console.error('Error updating item:', error);
      if (previousCart) setCart(previousCart);
    }
  };

  const removeItem = async (itemId: number) => {
    const previousCart = cart;
    if (cart) {
      setCart({
        ...cart,
        items: cart.items.filter(item => item.id !== itemId),
      });
    }
    try {
      const { data } = await api.delete(`/cart/items/${itemId}`);
      if (data.success) {
        setCart(data.data);
      }
    } catch (error) {
      console.error('Error removing item:', error);
      if (previousCart) setCart(previousCart);
    }
  };

  const mergeCart = async () => {
    // Si no hay token, no fusionamos
    if (!localStorage.getItem('auth_access_token')) return;
    
    try {
      setIsLoading(true);
      const { data } = await api.post('/cart/merge');
      if (data.success) {
        setCart(data.data);
      }
    } catch (error) {
      console.error('Error merging cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
     
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        isOpen,
        openCart,
        closeCart,
        fetchCart,
        addItem,
        updateItem,
        removeItem,
        mergeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCartContext = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
};
