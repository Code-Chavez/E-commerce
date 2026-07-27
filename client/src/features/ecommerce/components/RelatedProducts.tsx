import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/shared/context/AuthContext';
import { relatedProductsService, type RelatedProductItem } from '../services/relatedProducts.service';
import ProductCard from './ProductCard';

interface RelatedProductsProps {
  productId: number;
  title?: string;
}

export const RelatedProducts: React.FC<RelatedProductsProps> = ({
  productId,
  title = 'También te puede interesar',
}) => {
  const { user } = useAuth();
  const [items, setItems] = useState<RelatedProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    const userId = user?.id ? parseInt(user.id, 10) : undefined;
    relatedProductsService
      .getRelated(productId, userId)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [productId, user?.id]);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (!loading && items.length === 0) return null;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-black text-brand-accent uppercase tracking-widest">{title}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-brand-primary/40 hover:border-brand-accent text-brand-text hover:text-brand-accent transition-colors"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-brand-primary/40 hover:border-brand-accent text-brand-text hover:text-brand-accent transition-colors"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-brand-accent" />
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
          style={{ scrollbarWidth: 'none' }}
        >
          {items.map(item => (
            <div key={item.id} className="shrink-0 w-44 sm:w-52">
              <ProductCard
                variantId={item.variantId}
                productSlug={item.slug}
                productName={item.name}
                brandName={item.brand?.name}
                images={item.images}
                isOutOfStock={item.isOutOfStock}
                minPrice={item.minPrice}
                maxPrice={item.maxPrice}
                minDiscount={item.minDiscount}
                maxDiscount={item.maxDiscount}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
