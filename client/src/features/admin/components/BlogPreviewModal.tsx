import React from 'react';
import { X, Calendar, User, Eye } from 'lucide-react';

interface BlogPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  authorName?: string;
}

export const BlogPreviewModal: React.FC<BlogPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  content,
  authorName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#F7F7F5] w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header bar */}
        <div className="bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#3F3F3F]" />
            <h2 className="text-lg font-bold text-[#3F3F3F]">Vista Previa del Artículo</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body - simulating public view */}
        <div className="flex-1 overflow-y-auto p-6 md:p-12 bg-white">
          <div className="max-w-2xl mx-auto">
            {/* Simulation tag */}
            <span className="text-[10px] bg-brand-primary text-brand-accent font-extrabold px-2 py-0.5 rounded tracking-widest uppercase mb-4 inline-block">
              VISTA PREVIA PÚBLICA
            </span>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-6">
              {title || 'Título del Artículo (Borrador)'}
            </h1>

            {/* Author and Date */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-8 border-b border-gray-100 pb-6">
              <div className="flex items-center gap-1.5 font-medium text-gray-700">
                <User className="w-4 h-4 text-gray-400" />
                <span>Por {authorName || 'Tú (Autor)'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>

            {/* Rich Content Area */}
            <div 
              className="prose prose-sm md:prose-base max-w-none text-gray-800 leading-relaxed font-sans"
              dangerouslySetInnerHTML={{ 
                __html: content || '<p className="text-gray-400 italic">Comienza a escribir en el editor para ver el contenido renderizado aquí...</p>' 
              }}
            />
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#3F3F3F] text-[#FAFAFA] text-xs font-bold rounded-lg hover:bg-black transition-all"
          >
            Cerrar Vista Previa
          </button>
        </div>
      </div>
    </div>
  );
};
