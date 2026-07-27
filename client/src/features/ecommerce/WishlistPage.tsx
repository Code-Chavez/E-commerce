import { useEffect, useState } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';
import { HeartCrack } from 'lucide-react';
import { useAuth } from '@/shared/context/AuthContext';
import { Link } from 'react-router-dom';
import ProductCard from './components/ProductCard';

interface WishlistItem {
  id: number;
  userId: number;
  variantId: number;
  addedAt: string;
  variant: {
    id: number;
    sku: string;
    price: string;
    discountPercent?: number;
    product: {
      id: number;
      name: string;
      slug: string;
      description: string;
      images: Array<{
        id: number;
        url: string;
        isMain: boolean;
      }>;
      variants?: Array<{
        branchStock?: Array<{ quantity: number }>;
      }>;
    };
  };
}

export const WishlistPage = () => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  const fetchWishlist = async () => {
    try {
      const response = await axiosInstance.get('/v1/wishlist');
      if (response.data?.success) {
        setItems(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toast.error('No se pudo cargar la lista de favoritos');
    } finally {
      setLoading(false);
    }
  };

   
  useEffect(() => {
    if (isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchWishlist();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);


  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] p-8 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
          <HeartCrack className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-[#3F3F3F] mb-2">Inicia sesión</h2>
          <p className="text-gray-500 mb-6">Debes iniciar sesión para ver tus favoritos.</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full py-3 px-4 bg-[#3F3F3F] text-white rounded-xl font-medium hover:bg-black transition-colors"
          >
            Ir al Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-[#3F3F3F] tracking-tight">Mis Favoritos</h1>
            <p className="text-sm text-gray-500 mt-1">
              {items.length} {items.length === 1 ? 'producto guardado' : 'productos guardados'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3F3F3F]"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
            <HeartCrack className="mx-auto h-20 w-20 text-gray-200 mb-6" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Tu lista está vacía</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-8">
              Aún no has guardado ningún producto. Explora nuestro catálogo y marca los que más te gusten.
            </p>
            <Link 
              to="/catalog"
              className="inline-block px-8 py-3 bg-[#3F3F3F] text-white rounded-full font-medium hover:bg-black transition-all transform hover:scale-105 active:scale-95"
            >
              Explorar productos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => {
              const productVariants = item.variant.product.variants || [];
              const isOutOfStock = productVariants.length > 0 && productVariants.every(v => 
                !v.branchStock || v.branchStock.length === 0 || v.branchStock.every(bs => bs.quantity <= 0)
              );

              return (
                <ProductCard 
                  key={item.id}
                  variantId={item.variantId}
                  productSlug={item.variant.product.slug}
                  productName={item.variant.product.name}
                  description={item.variant.product.description}
                  images={item.variant.product.images}
                  minPrice={Number(item.variant.price) * (1 - (item.variant.discountPercent || 0) / 100)}
                  maxPrice={Number(item.variant.price) * (1 - (item.variant.discountPercent || 0) / 100)}
                  minDiscount={item.variant.discountPercent || 0}
                  maxDiscount={item.variant.discountPercent || 0}
                  isOutOfStock={isOutOfStock}
                  initialIsWishlisted={true}
                  onFavoriteToggle={(variantId, isWishlisted) => {
                    if (!isWishlisted) {
                      setItems(prev => prev.filter(i => i.variantId !== variantId));
                    }
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
