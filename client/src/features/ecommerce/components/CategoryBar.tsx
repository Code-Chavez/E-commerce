import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '@/shared/api/axiosInstance';
import { Tag, Shirt, Sparkles, Footprints, Layers } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  parentId: number | null;
  imageUrl: string | null;
}

export default function CategoryBar() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axiosInstance.get('/v1/ecommerce/categories')
      .then(response => {
        if (response.data?.success) {
          // Filter to show only top-level (parent) categories
          const rootCategories = response.data.data.filter((c: Category) => c.parentId === null);
          setCategories(rootCategories);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getFallbackIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('polo') || lower.includes('camisa') || lower.includes('ropa') || lower.includes('vestido') || lower.includes('casaca')) {
      return <Shirt className="w-6 h-6 md:w-8 md:h-8 text-neutral-600 group-hover:text-brand-accent transition-colors" />;
    }
    if (lower.includes('zapato') || lower.includes('zapatilla') || lower.includes('calzado')) {
      return <Footprints className="w-6 h-6 md:w-8 md:h-8 text-neutral-600 group-hover:text-brand-accent transition-colors" />;
    }
    if (lower.includes('nuevo') || lower.includes('oferta') || lower.includes('exclusivo')) {
      return <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-neutral-600 group-hover:text-brand-accent transition-colors" />;
    }
    if (lower.includes('accesorio') || lower.includes('reloj') || lower.includes('gorra')) {
      return <Tag className="w-6 h-6 md:w-8 md:h-8 text-neutral-600 group-hover:text-brand-accent transition-colors" />;
    }
    return <Layers className="w-6 h-6 md:w-8 md:h-8 text-neutral-600 group-hover:text-brand-accent transition-colors" />;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-start sm:justify-center gap-6 overflow-x-auto pb-4 scrollbar-none">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2 shrink-0 animate-pulse">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-neutral-100 border border-neutral-200/60" />
              <div className="h-3 w-14 bg-neutral-100 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-start sm:justify-center gap-6 overflow-x-auto pb-4 scrollbar-none">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => navigate(`/catalog?categoryId=${category.id}`)}
            className="flex flex-col items-center gap-3 shrink-0 group focus:outline-none cursor-pointer"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border border-white/40 bg-white/30 backdrop-blur-md flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:border-white/60 group-hover:bg-white/40 group-hover:scale-105 group-active:scale-95 shadow-sm group-hover:shadow">
              {category.imageUrl ? (
                <img
                  src={category.imageUrl}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-transparent transition-colors">
                  {getFallbackIcon(category.name)}
                </div>
              )}
            </div>
            <span className="text-[10px] md:text-xs font-bold text-neutral-800 uppercase tracking-wider group-hover:text-neutral-900 group-hover:font-extrabold transition-all drop-shadow-sm">
              {category.name}
            </span>
          </button>
        ))}
      </div>

      {/* Hide scrollbar styles for clean horizontal scrolling */}
      <style>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
