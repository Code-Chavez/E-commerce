import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';
import { Loader2, FileText } from 'lucide-react';
import type { BlogPost } from '@/shared/types/blog';
import { BlogPostCard } from './components/BlogPostCard';

export const BlogListPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchPublicPosts = async () => {
      try {
        const { data } = await axiosInstance.get('/v1/blog');
        if (data.success) {
          setPosts(data.data || []);
        }
      } catch (error) {
        toast.error('No se pudieron cargar los artículos del blog');
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicPosts();
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F7F5] py-12 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Blog y Tendencias de Moda | D'Mendoza</title>
        <meta name="description" content="Encuentra guías de estilo, cuidado de prendas y las últimas tendencias de moda en el blog oficial de D'Mendoza." />
      </Helmet>

      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-4">El Blog de D'Mendoza</h1>
          <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
            Consejos de cuidado, guías de estilo y las últimas tendencias de moda urbana y formal diseñadas para ti.
          </p>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-10 h-10 animate-spin text-[#3F3F3F]" />
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-100 max-w-md mx-auto">
            <FileText className="mx-auto h-16 w-16 text-gray-200 mb-4" />
            <h2 className="text-xl font-bold text-[#3F3F3F] mb-1">Próximamente</h2>
            <p className="text-gray-500 text-sm">Estamos preparando excelentes artículos de moda para ti. ¡Vuelve pronto!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <BlogPostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogListPage;
