import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, EffectFade } from 'swiper/modules';
import axiosInstance from '@/shared/api/axiosInstance';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

interface Banner {
  id: number;
  imageUrl: string;
  linkUrl: string | null;
  order: number;
}

export default function HeroBanner() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get('/v1/ecommerce/banners')
      .then(response => {
        if (response.data?.success) {
          setBanners(response.data.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="w-full aspect-[4/3] md:aspect-[21/9] bg-neutral-100 animate-pulse flex items-center justify-center">
        <span className="text-sm font-medium text-neutral-400">Cargando colección...</span>
      </div>
    );
  }

  // Fallback if no banners are returned
  if (banners.length === 0) {
    return (
      <section className="w-full aspect-[4/3] md:aspect-[21/9] bg-neutral-200 flex items-center justify-center relative overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=2070" 
          className="absolute inset-0 w-full h-full object-cover opacity-80" 
          alt="Colección D'Mendoza" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight drop-shadow-md">
            COLECCIÓN 2026
          </h1>
          <p className="text-lg md:text-xl text-white font-medium drop-shadow-sm max-w-md mx-auto">
            Encuentra tu estilo perfecto con prendas de alta calidad diseñadas para ti.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full relative overflow-hidden group">
      <Swiper
        modules={[Pagination, Autoplay, EffectFade]}
        effect="fade"
        spaceBetween={0}
        slidesPerView={1}
        autoHeight={true}
        pagination={{ clickable: true, el: '.custom-banner-pagination' }}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        loop={banners.length > 1}
        className="w-full h-auto"
      >
        {banners.map((banner) => {
          const slideContent = (
            <div className="w-full h-full flex items-center justify-center bg-neutral-100">
              <img
                src={banner.imageUrl}
                alt="Banner promocional"
                className="w-full h-auto block"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/20 via-transparent to-transparent pointer-events-none" />
            </div>
          );

          return (
            <SwiperSlide key={banner.id} className="w-full h-full">
              {banner.linkUrl ? (
                <a href={banner.linkUrl} className="block w-full h-full focus:outline-none">
                  {slideContent}
                </a>
              ) : (
                slideContent
              )}
            </SwiperSlide>
          );
        })}
      </Swiper>
      
      {/* Editorial Styled Pagination Dots */}
      <div className="custom-banner-pagination absolute bottom-6 left-1/2 -translate-x-1/2 flex justify-center gap-2 z-10 !w-auto" />
      
      {/* Styles to customize pagination dot appearance cleanly */}
      <style>{`
        .custom-banner-pagination .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
          background: rgba(255, 255, 255, 0.4);
          opacity: 1;
          transition: all 0.3s ease;
          border-radius: 9999px;
        }
        .custom-banner-pagination .swiper-pagination-bullet-active {
          background: #ffffff !important;
          width: 24px;
        }
      `}</style>
    </section>
  );
}
