import { useEffect, useState } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import ProductCard from './ProductCard';

interface GroupedProduct {
  id: number;
  code: string;
  name: string;
  slug: string;
  description: string | null;
  categoryId: number;
  brandId: number;
  gender?: { id: number; name: string } | null;
  category: { id: number; name: string };
  brand: { id: number; name: string };
  images: Array<{ id: number; productId: number; url: string; isMain: boolean }>;
  minDiscount: number;
  maxDiscount: number;
  minPrice: number;
  maxPrice: number;
  outOfStock: boolean;
  variants: Array<{ id: number }>;
}

export default function OnSaleSection() {
  const [products, setProducts] = useState<GroupedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get('/v1/ecommerce/products/on-sale')
      .then(response => {
        if (response.data?.success) {
          setProducts(response.data.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="py-8 text-center text-gray-500">Cargando ofertas...</div>;
  }

  if (products.length === 0) {
    return null; // Ocultar si no hay productos en oferta
  }

  return (
    <section className="py-12 border-y border-neutral-100/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 flex items-center gap-2">
          Súper Ofertas
        </h2>
        
        <Swiper
          modules={[Navigation, Pagination, A11y, Autoplay]}
          spaceBetween={20}
          slidesPerView={1.5}
          navigation
          pagination={{ clickable: true }}
          autoplay={{ delay: 4000, disableOnInteraction: true }}
          breakpoints={{
            480: { slidesPerView: 2 },
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 4 },
            1280: { slidesPerView: 5 },
          }}
          className="pb-12"
        >
          {products.map((product) => {
            return (
              <SwiperSlide key={product.id} className="h-auto">
                <ProductCard 
                  variantId={product.variants?.[0]?.id || product.id}
                  productSlug={product.slug}
                  productName={product.name}
                  brandName={product.brand?.name}
                  images={product.images}
                  minPrice={product.minPrice}
                  maxPrice={product.maxPrice}
                  minDiscount={product.minDiscount}
                  maxDiscount={product.maxDiscount}
                  isOutOfStock={product.outOfStock}
                />
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </section>
  );
}
