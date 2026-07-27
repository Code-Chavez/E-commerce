import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';
import { Loader2, Plus, Pencil, Archive, FileText, Calendar, User, Search, BookOpen, Eye } from 'lucide-react';
import type { BlogPost, PostStatus } from '@/shared/types/blog';

export const BlogAdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/v1/admin/blog');
      setPosts(data.data || []);
    } catch (error) {
      toast.error('No se pudieron cargar los artículos del blog');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: PostStatus) => {
    const newStatus = currentStatus === 'DRAFT' ? 'PUBLISHED' : 'DRAFT';
    try {
      await axiosInstance.patch(`/v1/admin/blog/${id}`, { status: newStatus });
      toast.success(newStatus === 'PUBLISHED' ? 'Artículo publicado' : 'Artículo cambiado a borrador');
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)));
    } catch (error) {
      toast.error('No se pudo actualizar el estado del artículo');
    }
  };

  const handleArchive = async (id: number) => {
    if (!window.confirm('¿Está seguro de que desea archivar este artículo?')) return;
    try {
      await axiosInstance.delete(`/v1/admin/blog/${id}`);
      toast.success('Artículo archivado exitosamente');
      fetchPosts();
    } catch (error) {
      toast.error('No se pudo archivar el artículo');
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (post.author?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || post.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-[#F7F7F5]/50">
      {/* Header Area */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#3F3F3F]">Gestión del Blog</h1>
          <p className="text-[#6B6B6B] mt-1">Crea, edita y publica artículos con metadatos optimizados para SEO.</p>
        </div>
        <button
          onClick={() => navigate('/admin/blog/new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#3F3F3F] text-[#FAFAFA] rounded-xl text-sm font-bold shadow hover:bg-[#3F3F3F]/95 transition-all"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>Nuevo Artículo</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por título o autor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3F3F3F] focus:border-[#3F3F3F] text-gray-800"
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3F3F3F] focus:border-[#3F3F3F] text-gray-800"
          >
            <option value="ALL">Todos los estados</option>
            <option value="PUBLISHED">Publicados</option>
            <option value="DRAFT">Borradores</option>
          </select>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-[#3F3F3F]" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16 px-4">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-[#3F3F3F] mb-1">No se encontraron artículos</h3>
            <p className="text-xs text-gray-400">Intenta cambiar los filtros de búsqueda o crea uno nuevo.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-100 text-xs font-bold uppercase tracking-wider text-[#6B6B6B]">
                  <th className="px-6 py-4">Artículo</th>
                  <th className="px-6 py-4">Autor</th>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Vistas</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-[#3F3F3F]">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50/40 transition duration-150">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900 line-clamp-1">{post.title}</span>
                        <span className="text-xs text-gray-400 font-mono mt-0.5">/{post.slug}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                        <User className="w-3.5 h-3.5" />
                        <span>{post.author?.name || 'Sistema'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(post.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-xs font-semibold text-gray-700 bg-gray-50 px-2 py-1 rounded-md w-fit border border-gray-100">
                        <Eye className="w-3.5 h-3.5 text-gray-400" />
                        <span>{post.views || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(post.id, post.status)}
                        disabled={post.status === 'ARCHIVED'}
                        title={post.status === 'ARCHIVED' ? 'Archivado' : 'Haga clic para cambiar el estado'}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase transition-all select-none border ${
                          post.status === 'PUBLISHED'
                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100/50 cursor-pointer hover:scale-105 active:scale-95'
                            : post.status === 'ARCHIVED'
                            ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed opacity-70'
                            : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100/50 cursor-pointer hover:scale-105 active:scale-95'
                        }`}
                      >
                        {post.status === 'PUBLISHED' ? 'Publicado' : post.status === 'ARCHIVED' ? 'Archivado' : 'Borrador'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {post.status === 'PUBLISHED' && (
                          <a
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition"
                            title="Ver en Tienda"
                          >
                            <BookOpen className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => navigate(`/admin/blog/${post.id}/edit`)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-[#3F3F3F] hover:text-black transition"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleArchive(post.id)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 hover:text-red-700 transition"
                          title="Archivar"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogAdminPage;
