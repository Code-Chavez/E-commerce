import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, 
  Loader2, 
  Eye, 
  Save, 
  Globe, 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  Undo, 
  Redo,
  Layout,
  Search,
  Calendar,
  Tag
} from 'lucide-react';
import { BlogPreviewModal } from './components/BlogPreviewModal';
import type { BlogPost } from '@/shared/types/blog';

// Mini editor menu bar
const EditorMenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-200 rounded-t-xl">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-1.5 rounded hover:bg-gray-200 transition ${editor.isActive('bold') ? 'bg-gray-300 text-gray-900' : 'text-gray-600'}`}
        title="Negrita"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded hover:bg-gray-200 transition ${editor.isActive('italic') ? 'bg-gray-300 text-gray-900' : 'text-gray-600'}`}
        title="Cursiva"
      >
        <Italic className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-gray-200 my-auto mx-1" />
      
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-1.5 rounded hover:bg-gray-200 transition ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-300 text-gray-900' : 'text-gray-600'}`}
        title="Título 1"
      >
        <Heading1 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-1.5 rounded hover:bg-gray-200 transition ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-300 text-gray-900' : 'text-gray-600'}`}
        title="Título 2"
      >
        <Heading2 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`p-1.5 rounded hover:bg-gray-200 transition ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-300 text-gray-900' : 'text-gray-600'}`}
        title="Título 3"
      >
        <Heading3 className="w-4 h-4" />
      </button>
      
      <div className="w-px h-6 bg-gray-200 my-auto mx-1" />
      
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded hover:bg-gray-200 transition ${editor.isActive('bulletList') ? 'bg-gray-300 text-gray-900' : 'text-gray-600'}`}
        title="Lista de Viñetas"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded hover:bg-gray-200 transition ${editor.isActive('orderedList') ? 'bg-gray-300 text-gray-900' : 'text-gray-600'}`}
        title="Lista Numerada"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
      
      <div className="w-px h-6 bg-gray-200 my-auto mx-1" />
      
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="p-1.5 rounded hover:bg-gray-200 text-gray-600 disabled:opacity-40 transition"
        title="Deshacer"
      >
        <Undo className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="p-1.5 rounded hover:bg-gray-200 text-gray-600 disabled:opacity-40 transition"
        title="Rehacer"
      >
        <Redo className="w-4 h-4" />
      </button>
    </div>
  );
};

export const BlogEditorPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form states
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('DRAFT');
  const [authorName, setAuthorName] = useState('');
  
  const [publishedAt, setPublishedAt] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  // Preview state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Initialize TipTap Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[300px] max-h-[500px] overflow-y-auto px-4 py-3 prose prose-sm md:prose-base max-w-none text-gray-800 font-sans',
      },
    },
  });

  // Slug auto-generation from Title
  useEffect(() => {
    if (!isEditMode && title) {
      const autoSlug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove accents
        .replace(/[^a-z0-9\s-]/g, '') // remove special chars
        .trim()
        .replace(/\s+/g, '-'); // replace spaces with hyphens
      setSlug(autoSlug);
    }
  }, [title, isEditMode]);

  // Load post in Edit Mode
  useEffect(() => {
    if (isEditMode) {
      const fetchPostDetail = async () => {
        setLoading(true);
        try {
          const { data } = await axiosInstance.get(`/v1/admin/blog/${id}`);
          if (data.success && data.data) {
            const post: BlogPost = data.data;
            setTitle(post.title);
            setSlug(post.slug);
            setMetaTitle(post.metaTitle || '');
            setMetaDescription(post.metaDescription || '');
            setStatus(post.status);
            setAuthorName(post.author?.name || '');
            if (post.publishedAt) {
              const date = new Date(post.publishedAt);
              // Ajustamos la fecha restando el offset horario local para obtener la cadena YYYY-MM-DDThh:mm en la zona horaria del usuario
              const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
              setPublishedAt(localDate.toISOString().slice(0, 16));
            }
            if (post.tags && post.tags.length > 0) {
              setTagsInput(post.tags.join(', '));
            }
            if (editor && post.content) {
              editor.commands.setContent(post.content);
            }
          }
        } catch (error) {
          toast.error('Error al cargar los detalles del artículo');
          navigate('/admin/blog');
        } finally {
          setLoading(false);
        }
      };

      fetchPostDetail();
    }
  }, [id, isEditMode, editor]);

  // Handle Save
  const handleSave = async (targetStatus: 'DRAFT' | 'PUBLISHED') => {
    if (!title.trim()) {
      toast.error('El título es requerido');
      return;
    }

    const contentHtml = editor?.getHTML() || '';
    if (!contentHtml.trim() || contentHtml === '<p></p>') {
      toast.error('El contenido del artículo no puede estar vacío');
      return;
    }

    setSubmitting(true);
    const payload = {
      title,
      slug,
      content: contentHtml,
      status: targetStatus,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean)
    };

    try {
      if (isEditMode) {
        await axiosInstance.patch(`/v1/admin/blog/${id}`, payload);
        toast.success('Artículo actualizado correctamente');
      } else {
        await axiosInstance.post('/v1/admin/blog', payload);
        toast.success('Artículo creado exitosamente');
      }
      navigate('/admin/blog');
    } catch (error: any) {
      const errMsg = error.response?.data?.error?.[0]?.message || error.response?.data?.error || 'Error al guardar el artículo';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#F7F7F5]/50">
        <Loader2 className="w-10 h-10 animate-spin text-[#3F3F3F]" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto min-h-screen bg-[#F7F7F5]/50">
      {/* Top Header Bar */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => navigate('/admin/blog')}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-800 transition bg-white border border-gray-200 rounded-lg hover:shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al listado</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-700 transition"
          >
            <Eye className="w-4 h-4" />
            <span>Vista Previa</span>
          </button>
          
          <button
            onClick={() => handleSave('DRAFT')}
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#D9D9D2] hover:bg-[#D9D9D2]/90 text-[#3F3F3F] rounded-xl text-xs font-bold transition disabled:opacity-50"
          >
            {submitting && status === 'DRAFT' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Borrador</span>
          </button>

          <button
            onClick={() => handleSave('PUBLISHED')}
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#3F3F3F] text-white hover:bg-black rounded-xl text-xs font-bold transition disabled:opacity-50"
          >
            {submitting && status === 'PUBLISHED' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Globe className="w-4 h-4" />
            )}
            <span>Publicar</span>
          </button>
        </div>
      </div>

      {/* Main Title Area */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#3F3F3F]">
          {isEditMode ? 'Editar Artículo' : 'Nuevo Artículo de Blog'}
        </h1>
        <p className="text-xs text-gray-500 mt-1">Escribe contenido enriquecido y edita el SEO para indexación orgánica.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form (Content) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Article Info */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Título del Artículo</label>
              <input
                type="text"
                placeholder="Ingresa el título aquí..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50/75 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3F3F3F] focus:border-[#3F3F3F] text-gray-800 text-lg font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Slug Único (Enlace)</label>
              <div className="flex items-center bg-gray-50/75 border border-gray-200 rounded-lg px-3 py-1.5">
                <span className="text-xs text-gray-400 font-mono select-none">/blog/</span>
                <input
                  type="text"
                  placeholder="slug-del-articulo"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none text-xs text-gray-700 font-mono ml-0.5 p-0"
                />
              </div>
            </div>
          </div>

          {/* Editor Container */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <span className="text-xs font-bold text-[#3F3F3F] uppercase tracking-wider">Cuerpo del Artículo</span>
              <span className="text-[10px] text-gray-400">TipTap Editor</span>
            </div>
            
            <EditorMenuBar editor={editor} />
            
            <div className="bg-white border-b border-gray-200">
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>

        {/* Right Form (SEO Details) */}
        <div className="lg:col-span-1 space-y-6">
          {/* SEO Details Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#3F3F3F] flex items-center gap-1.5 border-b border-gray-100 pb-3">
              <Layout className="w-4 h-4 text-gray-500" />
              <span>Optimización SEO</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Meta Título (Recomendado 60 chars)</label>
              <input
                type="text"
                placeholder={title ? `${title.slice(0, 50)} | Brand` : 'Título para Google...'}
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                maxLength={70}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3F3F3F] focus:border-[#3F3F3F] text-xs text-gray-800"
              />
              <span className="text-[10px] text-gray-400 mt-1 block text-right">{metaTitle.length}/70 chars</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Meta Descripción (Recomendado 160 chars)</label>
              <textarea
                placeholder="Descripción concisa para mostrar en resultados de búsqueda de Google..."
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={4}
                maxLength={160}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3F3F3F] focus:border-[#3F3F3F] text-xs text-gray-800 resize-none"
              />
              <span className="text-[10px] text-gray-400 mt-1 block text-right">{metaDescription.length}/160 chars</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Calendar className="w-3 h-3"/> Programar Publicación (Opcional)</label>
              <input
                type="datetime-local"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3F3F3F] focus:border-[#3F3F3F] text-xs text-gray-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Tag className="w-3 h-3"/> Etiquetas SEO (Separadas por comas)</label>
              <input
                type="text"
                placeholder="tecnologia, ecommerce, tips"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3F3F3F] focus:border-[#3F3F3F] text-xs text-gray-800"
              />
            </div>

            <div className="bg-gray-50 p-3.5 rounded-lg border border-dashed border-gray-200 space-y-1.5">
              <span className="text-[10px] font-bold text-blue-600 flex items-center gap-1">
                <Search className="w-3 h-3" /> Google Preview
              </span>
              <p className="text-[11px] font-mono text-blue-800 hover:underline truncate">
                http://localhost:5173/blog/{slug || 'enlace'}
              </p>
              <p className="text-xs text-[#3F3F3F] font-bold line-clamp-1">
                {metaTitle || title || 'Título que se verá en buscadores'}
              </p>
              <p className="text-[10px] text-gray-500 line-clamp-2">
                {metaDescription || 'Meta descripción del artículo que Google mostrará para su posicionamiento en las búsquedas orgánicas...'}
              </p>
            </div>
          </div>

          {/* Status info */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-gray-500 uppercase tracking-wider">Estado actual:</span>
              <span className={`px-2 py-0.5 rounded font-bold uppercase ${status === 'PUBLISHED' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                {status === 'PUBLISHED' ? 'Publicado' : 'Borrador'}
              </span>
            </div>
            {isEditMode && authorName && (
              <div className="text-[11px] text-gray-400 border-t border-gray-100 pt-3">
                Escrito por: <strong className="text-gray-600">{authorName}</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <BlogPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={title}
        content={editor?.getHTML() || ''}
        authorName={authorName || undefined}
      />
    </div>
  );
};

export default BlogEditorPage;
