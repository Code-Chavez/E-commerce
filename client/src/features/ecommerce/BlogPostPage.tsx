import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';
import { Calendar, User, ArrowLeft, Loader2, FileText } from 'lucide-react';
import type { BlogPost } from '@/shared/types/blog';

export const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchPostDetail = async () => {
      setLoading(true);
      try {
        const { data } = await axiosInstance.get(`/v1/blog/${slug}`);
        if (data.success && data.data) {
          setPost(data.data);
        } else {
          toast.error('Artículo no encontrado');
          navigate('/blog');
        }
      } catch (error) {
        toast.error('Artículo no encontrado');
        navigate('/blog');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPostDetail();
    }
  }, [slug, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#F7F7F5]">
        <Loader2 className="w-10 h-10 animate-spin text-[#3F3F3F]" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex flex-col items-center justify-center p-6">
        <FileText className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-800">Artículo no encontrado</h2>
        <p className="text-sm text-gray-500 mb-6">El artículo solicitado no existe o fue retirado.</p>
        <Link to="/blog" className="px-5 py-2.5 bg-[#3F3F3F] text-white rounded-xl text-xs font-bold shadow hover:bg-black transition-all">
          Volver al Blog
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(post.createdAt).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#F7F7F5] py-12 px-4 sm:px-6 lg:px-8">
      {/* Helmet dynamic SEO injection */}
      <Helmet>
        <title>{post.metaTitle || `${post.title} | Blog D'Mendoza`}</title>
        <meta name="description" content={post.metaDescription || `${post.title}. Conoce todos los detalles en nuestro blog.`} />
        {/* OpenGraph / Social SEO fallback */}
        <meta property="og:title" content={post.metaTitle || post.title} />
        <meta property="og:description" content={post.metaDescription || post.title} />
        <meta property="og:type" content="article" />
        {post.tags?.map((tag) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}
      </Helmet>

      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <div className="mb-8">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 text-xs font-bold text-gray-600 rounded-xl hover:shadow-sm hover:text-black transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Blog</span>
          </Link>
        </div>

        {/* Article Container */}
        <article className="bg-white rounded-3xl p-6 sm:p-12 border border-gray-100 shadow-sm overflow-hidden">
          {/* Header */}
          <header className="mb-8 border-b border-gray-100 pb-8">
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight tracking-tight mb-4">
              {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1.5 font-medium text-gray-700">
                <User className="w-4 h-4 text-gray-400" />
                <span>Por {post.author?.name || 'Redacción D\'Mendoza'}</span>
              </div>
              <div className="w-1 h-1 bg-gray-300 rounded-full" />
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>Publicado el {formattedDate}</span>
              </div>
            </div>
          </header>

          {/* Body Content */}
          <div 
            className="prose prose-sm md:prose-base max-w-none text-gray-800 leading-relaxed font-sans"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>
      </div>
    </div>
  );
};

export default BlogPostPage;
