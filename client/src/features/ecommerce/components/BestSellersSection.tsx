import { useEffect, useState } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import ProductCard from './ProductCard';
import type { ProductVariant } from '../types';

export default function BestSellersSection() {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get('/v1/ecommerce/products/best-sellers', { params: { limit: 10 } })
      .then(response => {
        if (response.data?.success) {
          setVariants(response.data.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);



  if (loading) {
    return <div className="py-8 text-center text-gray-500">Cargando los más vendidos...</div>;
  }

  if (variants.length === 0) {
    return null; // Ocultar si no hay productos
  }

  // Deduplicar variantes para que no se muestre el mismo producto varias veces
  const uniqueVariants = Array.from(
    new Map(variants.map(v => [v.productId, v])).values()
  );

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 flex items-center gap-2">
          Lo Más Vendido
        </h2>
        
        <Swiper
          modules={[Navigation, Pagination, A11y, Autoplay]}
          spaceBetween={20}
          slidesPerView={1.5}
          navigation
          pagination={{ clickable: true }}
          autoplay={{ delay: 3000, disableOnInteraction: true }}
          breakpoints={{
            480: { slidesPerView: 2 },
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 4 },
            1280: { slidesPerView: 5 },
          }}
          className="pb-12" // padding para la paginación
        >
          {uniqueVariants.map((variant) => {
            const price = Number(variant.price);
            const discountAmount = variant.discountPercent > 0 ? (price * variant.discountPercent) / 100 : 0;
            const finalPrice = price - discountAmount;

            return (
              <SwiperSlide key={variant.id} className="h-auto">
                <ProductCard 
                  variantId={variant.id}
                  productSlug={variant.product.slug}
                  productName={variant.product.name}
                  brandName={variant.product.brand?.name}
                  images={variant.product.images}
                  minPrice={finalPrice}
                  maxPrice={finalPrice}
                  minDiscount={variant.discountPercent}
                  maxDiscount={variant.discountPercent}
                  isOutOfStock={variant.outOfStock}
                />
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </section>
  );
}
