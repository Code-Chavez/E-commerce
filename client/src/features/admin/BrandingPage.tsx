import React, { useEffect, useState, useRef } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';
import { Palette, Globe, Save, Loader2, Image as ImageIcon, UploadCloud, Plus, Trash2, Link as LinkIcon } from 'lucide-react';
import { useBrand } from '@/shared/context/BrandContext';

const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
  switch (name.toLowerCase()) {
    case 'facebook': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>;
    case 'instagram': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>;
    case 'twitter':
    case 'x': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>;
    case 'tiktok': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>;
    case 'linkedin': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>;
    case 'youtube': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>;
    default: return <LinkIcon width="20" height="20" className={className} />;
  }
};

interface BrandConfig {
  brandName: string;
  faviconUrl: string | null;
  logoHorizontalUrl: string | null;
  logoVerticalUrl: string | null;
  colorBrandBg: string;
  colorBrandPrimary: string;
  colorBrandText: string;
  colorBrandAccent: string;
  socialLinksJson: Record<string, string> | null;
}

const LogoUploader = ({ 
  label, 
  url, 
  onUpload 
}: { 
  label: string; 
  url: string | null; 
  onUpload: (file: File) => Promise<void> 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se admiten imágenes');
      return;
    }
    setIsUploading(true);
    try {
      await onUpload(file);
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-[#3F3F3F]">{label}</label>
      <div 
        className={`relative flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl transition-colors overflow-hidden
          ${isDragging ? 'border-[#3F3F3F] bg-[#D9D9D2]/20' : 'border-[#D9D9D2] bg-white hover:border-[#3F3F3F] hover:bg-[#F7F7F5]'}
          ${url ? 'h-32' : 'h-32'}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        {isUploading ? (
          <div className="flex flex-col items-center text-[#3F3F3F]/60">
            <Loader2 className="w-6 h-6 animate-spin mb-2 text-[#3F3F3F]" />
            <span className="text-xs font-medium">Subiendo...</span>
          </div>
        ) : url ? (
          <div className="relative w-full h-full flex items-center justify-center group cursor-pointer bg-white/50 rounded p-2">
            <img src={url} alt={label} className="max-w-full max-h-full object-contain" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded">
              <span className="text-white text-xs font-medium">Cambiar</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-[#3F3F3F]/50 cursor-pointer">
            <UploadCloud className="w-8 h-8 mb-2 text-[#D9D9D2]" />
            <span className="text-sm font-medium text-[#3F3F3F]">Clic o arrastrar</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const BrandingPage: React.FC = () => {
  const [config, setConfig] = useState<BrandConfig>({
    brandName: '',
    faviconUrl: null,
    logoHorizontalUrl: null,
    logoVerticalUrl: null,
    colorBrandBg: '#F7F7F5',
    colorBrandPrimary: '#D9D9D2',
    colorBrandText: '#6B6B6B',
    colorBrandAccent: '#3F3F3F',
    socialLinksJson: {}
  });
  
  // Array dinámico para las redes sociales en estado local (para iteración fácil en UI)
  const [socialLinks, setSocialLinks] = useState<{platform: string, url: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { refreshBrandConfig } = useBrand();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data } = await axiosInstance.get('/v1/config/brand');
      if (data.success) {
        setConfig(data.data);
        // Map el Record JSON a array de [{platform, url}]
        const existingLinks = data.data.socialLinksJson || {};
        const linksArray = Object.keys(existingLinks).map(key => ({
          platform: key,
          url: existingLinks[key]
        }));
        setSocialLinks(linksArray);
      }
    } catch (error: any) {
      toast.error('Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Re-map el array de vuelta al formato Record<string, string> JSON
      const linksJson: Record<string, string> = {};
      socialLinks.forEach(link => {
        if (link.platform.trim() && link.url.trim()) {
          linksJson[link.platform.toLowerCase().trim()] = link.url.trim();
        }
      });

      const payload = { ...config, socialLinksJson: linksJson };
      
      await axiosInstance.put('/v1/config/brand', payload);
      setConfig(payload);
      
      // Update global context so the whole app updates immediately
      await refreshBrandConfig();
      
      toast.success('Configuración actualizada correctamente');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const addSocialLink = () => {
    setSocialLinks([...socialLinks, { platform: '', url: '' }]);
  };

  const updateSocialLink = (index: number, field: 'platform' | 'url', value: string) => {
    const newLinks = [...socialLinks];
    newLinks[index][field] = value;
    setSocialLinks(newLinks);
  };

  const removeSocialLink = (index: number) => {
    const newLinks = [...socialLinks];
    newLinks.splice(index, 1);
    setSocialLinks(newLinks);
  };

  const handleLogoUpload = async (file: File, key: keyof Pick<BrandConfig, 'faviconUrl' | 'logoHorizontalUrl' | 'logoVerticalUrl'>) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const { data } = await axiosInstance.post('/v1/config/brand/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (data.success) {
        setConfig(prev => ({ ...prev, [key]: data.data.url }));
        toast.success('Logo subido correctamente');
      }
    } catch (error) {
      toast.error('Error al subir el logo');
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#3F3F3F]" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-[#F7F7F5] text-[#3F3F3F]">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#3F3F3F]">Identidad Visual</h1>
          <p className="text-[#3F3F3F]/60">Configura el branding, colores y redes sociales de tu plataforma.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 text-[#F7F7F5] px-6 py-2.5 rounded-xl transition-all shadow-md font-medium disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar Cambios
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          
          {/* SECCIÓN: NOMBRES Y LOGOS */}
          <div className="bg-white p-6 rounded-2xl border border-[#D9D9D2] shadow-sm space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2 border-b border-[#D9D9D2]/40 pb-4 text-[#3F3F3F]">
              <ImageIcon className="w-5 h-5 text-[#3F3F3F]" />
              Marca y Logos
            </h2>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#3F3F3F]">Nombre de la Marca</label>
              <input
                type="text"
                value={config.brandName}
                onChange={(e) => setConfig({ ...config, brandName: e.target.value })}
                className="w-full px-4 py-2 border border-[#D9D9D2] rounded-xl focus:border-[#3F3F3F] outline-none transition-colors"
                placeholder="Ej. D'Mendoza"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <LogoUploader 
                label="Favicon" 
                url={config.faviconUrl} 
                onUpload={(f) => handleLogoUpload(f, 'faviconUrl')} 
              />
              <LogoUploader 
                label="Logo Horizontal" 
                url={config.logoHorizontalUrl} 
                onUpload={(f) => handleLogoUpload(f, 'logoHorizontalUrl')} 
              />
              <LogoUploader 
                label="Logo Vertical" 
                url={config.logoVerticalUrl} 
                onUpload={(f) => handleLogoUpload(f, 'logoVerticalUrl')} 
              />
            </div>
          </div>

          {/* SECCIÓN: COLORES */}
          <div className="bg-white p-6 rounded-2xl border border-[#D9D9D2] shadow-sm space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2 border-b border-[#D9D9D2]/40 pb-4 text-[#3F3F3F]">
              <Palette className="w-5 h-5 text-[#3F3F3F]" />
              Colores Principales
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Color de Fondo (Bg)', key: 'colorBrandBg' },
                { label: 'Color Primario', key: 'colorBrandPrimary' },
                { label: 'Color de Texto', key: 'colorBrandText' },
                { label: 'Color de Acento', key: 'colorBrandAccent' },
              ].map((colorField) => (
                <div key={colorField.key} className="space-y-2">
                  <label className="text-sm font-semibold text-[#3F3F3F]">{colorField.label}</label>
                  <div className="flex gap-4 items-center">
                    <input
                      type="color"
                      value={config[colorField.key as keyof BrandConfig] as string}
                      onChange={(e) => setConfig({ ...config, [colorField.key]: e.target.value })}
                      className="w-12 h-12 rounded cursor-pointer border-none bg-transparent p-0"
                    />
                    <input
                      type="text"
                      value={config[colorField.key as keyof BrandConfig] as string}
                      onChange={(e) => setConfig({ ...config, [colorField.key]: e.target.value })}
                      className="flex-1 px-4 py-2 border border-[#D9D9D2] rounded-xl outline-none focus:border-[#3F3F3F] uppercase font-mono text-sm transition-colors"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECCIÓN: REDES SOCIALES DINÁMICAS */}
          <div className="bg-white p-6 rounded-2xl border border-[#D9D9D2] shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-[#D9D9D2]/40 pb-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-[#3F3F3F]">
                <Globe className="w-5 h-5 text-[#3F3F3F]" />
                Redes Sociales
              </h2>
              <button 
                onClick={addSocialLink}
                className="flex items-center gap-1 text-sm font-medium text-[#3F3F3F] bg-[#D9D9D2]/30 hover:bg-[#D9D9D2]/60 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" /> Añadir
              </button>
            </div>
            
            {socialLinks.length === 0 ? (
              <p className="text-sm text-[#3F3F3F]/60 text-center py-4">No hay redes sociales configuradas. Haz clic en "Añadir" para agregar una.</p>
            ) : (
              <div className="space-y-4">
                {socialLinks.map((link, index) => (
                  <div key={index} className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex-shrink-0 w-8 flex justify-center items-center text-[#3F3F3F]">
                      <DynamicIcon name={link.platform} className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 flex flex-col sm:flex-row gap-3 w-full">
                      <input
                        type="text"
                        value={link.platform}
                        onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                        className="sm:w-1/3 px-3 py-2 text-sm border border-[#D9D9D2] rounded-lg outline-none focus:border-[#3F3F3F] placeholder:text-slate-400"
                        placeholder="Ej: facebook, tiktok, etc."
                      />
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-[#D9D9D2] rounded-lg outline-none focus:border-[#3F3F3F] placeholder:text-slate-400"
                        placeholder="https://..."
                      />
                    </div>

                    <button 
                      onClick={() => removeSocialLink(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      title="Eliminar red social"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* VISTA PREVIA (AISLADA) */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-[#3F3F3F]">Vista Previa Ecommerce</h2>
          <div 
            className="rounded-2xl border border-[#D9D9D2] shadow-xl overflow-hidden sticky top-6 transition-all duration-300"
            style={{ 
              backgroundColor: config.colorBrandBg,
              color: config.colorBrandText,
            }}
          >
            {/* Header Preview */}
            <div className="h-16 flex items-center px-6 justify-between shadow-sm" style={{ backgroundColor: '#ffffff' }}>
              {config.logoHorizontalUrl ? (
                <img src={config.logoHorizontalUrl} alt="Logo" className="h-8 max-w-[120px] object-contain" />
              ) : (
                <span className="font-bold text-lg" style={{ color: config.colorBrandAccent }}>
                  {config.brandName || 'Tu Marca'}
                </span>
              )}
              <div className="flex gap-4">
                <span className="text-sm font-medium cursor-pointer opacity-80 hover:opacity-100">Inicio</span>
                <span className="text-sm font-medium cursor-pointer opacity-80 hover:opacity-100">Catálogo</span>
              </div>
            </div>
            
            {/* Body Preview */}
            <div className="p-8 space-y-6">
              <div className="space-y-2 text-center">
                <h3 className="text-2xl font-bold" style={{ color: config.colorBrandAccent }}>
                  Descubre la nueva colección
                </h3>
                <p className="text-sm opacity-80">Encuentra los mejores productos seleccionados para ti.</p>
              </div>

              {/* Fake Banner */}
              <div className="h-40 rounded-xl flex items-center justify-center border-2 border-dashed border-opacity-30 relative overflow-hidden"
                   style={{ borderColor: config.colorBrandPrimary, backgroundColor: `${config.colorBrandPrimary}20` }}>
                <ImageIcon className="w-10 h-10 opacity-30" />
              </div>
              
              {/* Fake Button */}
              <button 
                className="w-full py-3 rounded-xl font-bold shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: config.colorBrandPrimary, color: config.colorBrandBg }}
              >
                Comprar Ahora
              </button>
            </div>

            {/* Footer Preview */}
            <div className="p-6 space-y-4" style={{ backgroundColor: config.colorBrandAccent, color: config.colorBrandBg }}>
              <div className="flex justify-between items-center">
                {config.logoVerticalUrl ? (
                  <img src={config.logoVerticalUrl} alt="Logo" className="h-10 max-w-[100px] object-contain brightness-0 invert" />
                ) : (
                  <span className="font-bold">{config.brandName || 'Tu Marca'}</span>
                )}
                <div className="flex gap-4">
                  {socialLinks.slice(0, 4).map((link, i) => (
                    <DynamicIcon key={i} name={link.platform} className="w-5 h-5 opacity-80 hover:opacity-100 cursor-pointer" />
                  ))}
                </div>
              </div>
              <div className="text-xs opacity-60 text-center border-t pt-4" style={{ borderColor: `${config.colorBrandBg}30` }}>
                © {new Date().getFullYear()} {config.brandName || 'Tu Marca'}. Todos los derechos reservados.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandingPage;
