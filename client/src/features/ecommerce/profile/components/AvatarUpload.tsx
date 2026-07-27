import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import toast from 'react-hot-toast';

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  name: string;
  lastName: string;
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
}

export const AvatarUpload = ({
  currentAvatarUrl,
  name,
  lastName,
  selectedFile,
  onFileSelect,
}: AvatarUploadProps) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate local preview URL
  const previewUrl = selectedFile ? URL.createObjectURL(selectedFile) : currentAvatarUrl;

  // Extract initials
  const initials = `${name?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || '?';

  const validateAndSelectFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Formato inválido. Solo se admiten archivos de imagen (JPEG, PNG, WEBP).');
      return;
    }

    // Validate size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('El archivo excede el límite de 5MB.');
      return;
    }

    onFileSelect(file);
    toast.success('Imagen lista para subir');
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    onFileSelect(null);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <span className="text-sm font-semibold text-brand-accent uppercase tracking-wider">
        Foto de Perfil
      </span>

      {/* Drag & Drop Zone Wrapper */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={handleButtonClick}
        className={`relative group w-44 h-44 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 border-2 overflow-hidden shadow-md
          ${
            isDragActive
              ? 'border-brand-accent bg-brand-primary scale-105 shadow-lg'
              : 'border-dashed border-brand-primary hover:border-brand-accent bg-white'
          }`}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={`${name} ${lastName}`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-brand-primary to-white text-brand-accent font-extrabold text-4xl">
            {initials}
          </div>
        )}

        {/* Hover Overlay with Glassmorphism */}
        <div className="absolute inset-0 bg-brand-accent/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-all duration-300 backdrop-blur-[2px]">
          <svg
            className="w-8 h-8 text-brand-bg animate-bounce"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
          <span className="text-xs font-semibold text-brand-bg text-center px-3">
            {isDragActive ? '¡Suéltalo aquí!' : 'Arrastra o haz clic para cambiar'}
          </span>
        </div>

        {/* Invisible File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleButtonClick}
          className="px-3 py-1.5 text-xs font-medium border border-brand-primary rounded-lg text-brand-text hover:bg-brand-primary/20 hover:text-brand-accent transition-colors"
        >
          Seleccionar Archivo
        </button>

        {selectedFile && (
          <button
            type="button"
            onClick={handleRemove}
            className="px-3 py-1.5 text-xs font-medium border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors animate-fade-in"
          >
            Revertir
          </button>
        )}
      </div>

      <span className="text-[11px] text-brand-text/70 text-center max-w-[200px]">
        Formatos admitidos: JPG, PNG o WEBP. Tamaño máximo: 5MB.
      </span>
    </div>
  );
};
