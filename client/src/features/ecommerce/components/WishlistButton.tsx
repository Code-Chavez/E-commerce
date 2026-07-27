import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '@/shared/context/AuthContext';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface WishlistButtonProps {
  variantId: number;
  initialIsWishlisted?: boolean;
  className?: string;
  size?: number;
  onToggle?: (variantId: number, isWishlisted: boolean) => void;
}

export const WishlistButton: React.FC<WishlistButtonProps> = ({ 
  variantId, 
  initialIsWishlisted = false,
  className = '',
  size = 24,
  onToggle
}) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isWishlisted, setIsWishlisted] = useState(initialIsWishlisted);
  const [isLoading, setIsLoading] = useState(false);

   
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsWishlisted(initialIsWishlisted);
  }, [initialIsWishlisted]);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Evitar que el clic abra la página del producto
    
    if (!isAuthenticated) {
      toast.error('Inicia sesión para agregar a favoritos');
      // Redirigimos al login
      navigate('/login');
      return;
    }

    setIsLoading(true);
    try {
      if (isWishlisted) {
        await axiosInstance.delete(`/v1/wishlist/${variantId}`);
        setIsWishlisted(false);
        toast.success('Eliminado de favoritos');
        onToggle?.(variantId, false);
      } else {
        await axiosInstance.post(`/v1/wishlist/${variantId}`);
        setIsWishlisted(true);
        toast.success('Agregado a favoritos');
        onToggle?.(variantId, true);
      }
    } catch (error: unknown) {
      console.error('Error toggling wishlist:', error);
      toast.error((error as any).response?.data?.error || 'Error al actualizar favoritos');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={toggleWishlist}
      disabled={isLoading}
      className={`p-2 rounded-full transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800 ${className}`}
      aria-label={isWishlisted ? "Quitar de favoritos" : "Agregar a favoritos"}
      title={isWishlisted ? "Quitar de favoritos" : "Agregar a favoritos"}
    >
      <Heart
        size={size}
        className={`transition-colors duration-300 ${
          isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'
        } ${isLoading ? 'animate-pulse' : ''}`}
      />
    </button>
  );
};
