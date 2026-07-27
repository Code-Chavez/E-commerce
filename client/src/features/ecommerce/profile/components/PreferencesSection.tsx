import React, { useState, useEffect } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { useUpdatePreferences } from '../hooks/useUpdatePreferences';
import type { ProfileDetails } from '../hooks/useProfile';

interface PreferencesSectionProps {
  profile: ProfileDetails | null;
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const COLORS = [
  { name: 'Negro', value: '#000000' },
  { name: 'Blanco', value: '#FFFFFF' },
  { name: 'Rojo', value: '#FF0000' },
  { name: 'Azul', value: '#0000FF' },
  { name: 'Verde', value: '#008000' },
  { name: 'Gris', value: '#808080' },
];

export const PreferencesSection: React.FC<PreferencesSectionProps> = ({ profile }) => {
  const { updatePreferences, isUpdating } = useUpdatePreferences();
  
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  useEffect(() => {
    if (profile?.preferencesJson) {
      const prefs = profile.preferencesJson as any;
      if (prefs.sizes) setSelectedSizes(prefs.sizes);
      if (prefs.colors) setSelectedColors(prefs.colors);
    }
  }, [profile]);

  const toggleSize = (size: string) => {
    setSelectedSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const toggleColor = (color: string) => {
    setSelectedColors(prev => 
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
  };

  const handleSave = async () => {
    await updatePreferences({
      sizes: selectedSizes,
      colors: selectedColors,
    });
  };

  if (!profile) return null;

  return (
    <div className="pt-4">
      <h3 className="text-sm font-bold uppercase tracking-wider mb-1 text-brand-accent flex items-center gap-2">
        <Heart className="w-4 h-4 text-pink-500" />
        Mis Preferencias
      </h3>
      <p className="text-xs text-[#6B6B6B] mb-4">
        Personaliza tu experiencia seleccionando tus tallas y colores favoritos.
      </p>
      <div className="h-[1px] mb-6 bg-brand-primary/40"></div>

      <div className="space-y-6">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-[#3F3F3F] mb-3">Tallas Favoritas</h4>
          <div className="flex flex-wrap gap-2">
            {SIZES.map(size => (
              <button
                key={size}
                onClick={() => toggleSize(size)}
                className={`w-10 h-10 rounded-full border flex items-center justify-center text-xs font-bold transition-all duration-300
                  ${selectedSizes.includes(size) 
                    ? 'bg-brand-accent text-white border-brand-accent shadow-md' 
                    : 'bg-white text-[#3F3F3F] border-[#D9D9D2] hover:border-brand-accent/50'
                  }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-[#3F3F3F] mb-3">Colores Favoritos</h4>
          <div className="flex flex-wrap gap-3">
            {COLORS.map(color => (
              <button
                key={color.name}
                onClick={() => toggleColor(color.name)}
                title={color.name}
                className={`w-10 h-10 rounded-full border-2 transition-all duration-300 relative
                  ${selectedColors.includes(color.name) ? 'border-brand-accent scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
                style={{ backgroundColor: color.value, borderColor: selectedColors.includes(color.name) ? '#FF4F00' : '#D9D9D2' }}
              >
                {selectedColors.includes(color.name) && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className={`w-2 h-2 rounded-full ${color.value === '#FFFFFF' ? 'bg-black' : 'bg-white'}`}></span>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={isUpdating}
            className="px-5 py-2.5 text-xs font-bold rounded-xl text-brand-accent border border-brand-accent hover:bg-brand-accent hover:text-white transition-all duration-300 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 disabled:opacity-50 shadow-sm"
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <span>Guardar Preferencias</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
