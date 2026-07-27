import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, ArrowRight } from 'lucide-react';
import type { BlogPost } from '@/shared/types/blog';

interface BlogPostCardProps {
  post: BlogPost;
}

export const BlogPostCard: React.FC<BlogPostCardProps> = ({ post }) => {
  // Strip HTML to create a snippet
  const getExcerpt = (html: string, maxLength: number = 120) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const text = doc.body.textContent || '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  const formattedDate = new Date(post.createdAt).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <article className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition duration-300">
      {/* Decorative colored header bar */}
      <div className="h-1 bg-brand-accent/10 group-hover:bg-brand-accent transition duration-300" />
      
      <div className="p-6 flex flex-col flex-1">
        {/* Date and Author */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-gray-400" />
            <span>{post.author?.name || 'Redacción D\'Mendoza'}</span>
          </div>
          <div className="w-1 h-1 bg-gray-300 rounded-full" />
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2 group-hover:text-brand-accent transition-colors">
          <Link to={`/blog/${post.slug}`} className="focus:outline-none">
            {post.title}
          </Link>
        </h3>

        {/* Snippet */}
        <p className="text-sm text-gray-500 line-clamp-3 mb-6 flex-1">
          {getExcerpt(post.content)}
        </p>

        {/* Action Link */}
        <div className="mt-auto">
          <Link
            to={`/blog/${post.slug}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-brand-accent hover:text-black uppercase tracking-wider transition-all"
          >
            <span>Leer Artículo</span>
            <ArrowRight className="w-3.5 h-3.5 transition group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </article>
  );
};
