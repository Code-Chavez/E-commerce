import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { 
  X, 
  Loader2, 
  MapPin, 
  Building2, 
  Phone, 
  Search,
  Map as MapIcon
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { branchSchema } from '../schemas/branch.schema';
import type { BranchFormData } from '../schemas/branch.schema';
import type { Branch } from '../hooks/useBranches';

// Modern Leaflet marker icon using SVG + Tailwind
const createCustomIcon = () => {
  return L.divIcon({
    html: `
      <div class="flex items-center justify-center w-8 h-8 rounded-full bg-[#3F3F3F] text-white border-2 border-white shadow-md animate-pulse">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.2 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    `,
    className: 'custom-leaflet-marker-wrapper',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

interface BranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BranchFormData) => Promise<any>;
  editingBranch: Branch | null;
  submitting: boolean;
}

export const BranchModal: React.FC<BranchModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingBranch,
  submitting,
}) => {
  const [mapLoading, setMapLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchingLocation, setSearchingLocation] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<BranchFormData>({
    resolver: yupResolver(branchSchema),
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      isMain: false,
      igvExempt: false,
    },
  });

  const watchedAddress = watch('address');

  // Reset form when editing branch changes
  useEffect(() => {
    if (editingBranch) {
      reset({
        name: editingBranch.name,
        address: editingBranch.address || '',
        phone: editingBranch.phone || '',
        isMain: editingBranch.isMain || false,
        igvExempt: editingBranch.igvExempt || false,
      });
    } else {
      reset({
        name: '',
        address: '',
        phone: '',
        isMain: false,
        igvExempt: false,
      });
    }
  }, [editingBranch, reset]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    // Timeout to ensure modal animation finishes before map calculates container size
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      const initialLat = -12.046374; // Default center (Lima, Peru)
      const initialLng = -77.042793;

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
      }).setView([initialLat, initialLng], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      // Add zoom control to top-right instead of default top-left
      L.control.zoom({ position: 'topright' }).addTo(map);

      mapRef.current = map;

      const markerIcon = createCustomIcon();

      // If editing and has address, try to geocode it; otherwise place default marker
      if (editingBranch && editingBranch.address) {
        geocodeAndPlaceMarker(editingBranch.address, map, markerIcon);
      } else {
        const marker = L.marker([initialLat, initialLng], {
          icon: markerIcon,
          draggable: true,
        }).addTo(map);

        markerRef.current = marker;

        // Setup drag event
        marker.on('dragend', () => {
          const position = marker.getLatLng();
          reverseGeocode(position.lat, position.lng);
        });
      }

      // Handle map clicks
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        placeMarkerAt(lat, lng, markerIcon);
        reverseGeocode(lat, lng);
      });
    }, 250);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [isOpen]);

  // Helper to place/update marker
  const placeMarkerAt = (lat: number, lng: number, icon: L.DivIcon) => {
    if (!mapRef.current) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const marker = L.marker([lat, lng], {
        icon,
        draggable: true,
      }).addTo(mapRef.current);

      markerRef.current = marker;

      marker.on('dragend', () => {
        const position = marker.getLatLng();
        reverseGeocode(position.lat, position.lng);
      });
    }

    mapRef.current.panTo([lat, lng]);
  };

  // Reverse Geocoding: Coordinates -> Address Text
  const reverseGeocode = async (lat: number, lng: number) => {
    setMapLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'es',
            'User-Agent': 'E-Commerce-project-client',
          },
        }
      );
      const data = await response.json();
      if (data && data.display_name) {
        // Strip excessive details for a cleaner address
        const formattedAddress = data.display_name;
        setValue('address', formattedAddress, { shouldValidate: true });
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    } finally {
      setMapLoading(false);
    }
  };

  // Geocoding: Address Text -> Coordinates & Map centering
  const geocodeAndPlaceMarker = async (addressText: string, mapInstance?: L.Map, customIcon?: L.DivIcon) => {
    const activeMap = mapInstance || mapRef.current;
    const activeIcon = customIcon || createCustomIcon();
    
    if (!activeMap || !addressText) return;

    setSearchingLocation(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressText)}&limit=1`,
        {
          headers: {
            'Accept-Language': 'es',
            'User-Agent': 'E-Commerce-project-client',
          },
        }
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);

        activeMap.setView([lat, lon], 16);
        placeMarkerAt(lat, lon, activeIcon);
      }
    } catch (error) {
      console.error('Error geocoding:', error);
    } finally {
      setSearchingLocation(false);
    }
  };

  // Search address typed in map search bar
  const handleMapSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    geocodeAndPlaceMarker(searchQuery);
  };

  // Sync map from typed form address field
  const handleSyncFromFormAddress = () => {
    if (watchedAddress) {
      geocodeAndPlaceMarker(watchedAddress);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-[#D9D9D2]/30 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#D9D9D2]/40 bg-[#F7F7F5]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#D9D9D2]/40 text-[#3F3F3F] rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#3F3F3F]">
                {editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal Comercial'}
              </h2>
              <p className="text-xs text-[#6B6B6B]">
                {editingBranch ? 'Actualiza los datos y la ubicación física.' : 'Crea una sucursal con almacén autogenerado.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#D9D9D2]/40 text-[#6B6B6B] hover:text-[#3F3F3F] rounded-full transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content (Grid Layout) */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Form Section */}
          <form 
            onSubmit={handleSubmit(onSubmit)} 
            id="branch-form"
            className="lg:col-span-5 space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-4">
              {/* Branch Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#3F3F3F] flex items-center gap-1.5">
                  Nombre Comercial <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B6B6B]/60">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    {...register('name')}
                    placeholder="Ej. Sucursal Sur"
                    className={`w-full pl-9 pr-4 py-2 bg-[#F7F7F5] border rounded-xl outline-none transition-all duration-200 text-[#3F3F3F] placeholder-[#6B6B6B]/40 focus:ring-1 focus:ring-[#3F3F3F] ${
                      errors.name 
                        ? 'border-rose-400 focus:border-rose-400' 
                        : 'border-[#D9D9D2] focus:border-[#3F3F3F]'
                    }`}
                  />
                </div>
                {errors.name && (
                  <p className="text-xs text-rose-500 font-medium mt-1">{errors.name.message}</p>
                )}
              </div>

              {/* Branch Phone */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#3F3F3F] flex items-center gap-1.5">
                  Teléfono de Contacto
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B6B6B]/60">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    {...register('phone')}
                    placeholder="Ej. +51 999 888 777"
                    className={`w-full pl-9 pr-4 py-2 bg-[#F7F7F5] border rounded-xl outline-none transition-all duration-200 text-[#3F3F3F] placeholder-[#6B6B6B]/40 focus:ring-1 focus:ring-[#3F3F3F] ${
                      errors.phone 
                        ? 'border-rose-400 focus:border-rose-400' 
                        : 'border-[#D9D9D2] focus:border-[#3F3F3F]'
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-rose-500 font-medium mt-1">{errors.phone.message}</p>
                )}
              </div>

              {/* Branch Address */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-[#3F3F3F] flex items-center gap-1.5">
                    Dirección Física
                  </label>
                  {watchedAddress && (
                    <button
                      type="button"
                      onClick={handleSyncFromFormAddress}
                      className="text-xs text-[#3F3F3F] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      title="Geocodifica la dirección ingresada para centrar el mapa"
                    >
                      <MapIcon className="w-3 h-3" />
                      <span>Sincronizar mapa</span>
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 pt-3 pointer-events-none text-[#6B6B6B]/60">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <textarea
                    rows={3}
                    {...register('address')}
                    placeholder="Usa el mapa de la derecha o escribe la dirección comercial aquí..."
                    className={`w-full pl-9 pr-4 py-2 bg-[#F7F7F5] border rounded-xl outline-none transition-all duration-200 text-[#3F3F3F] placeholder-[#6B6B6B]/40 focus:ring-1 focus:ring-[#3F3F3F] resize-none ${
                      errors.address 
                        ? 'border-rose-400 focus:border-rose-400' 
                        : 'border-[#D9D9D2] focus:border-[#3F3F3F]'
                    }`}
                  />
                </div>
                {errors.address && (
                  <p className="text-xs text-rose-500 font-medium mt-1">{errors.address.message}</p>
                )}
                <p className="text-[10px] text-[#6B6B6B] italic leading-tight">
                  Consejo: Haz clic en el mapa de la derecha para rellenar automáticamente la dirección.
                </p>
              </div>

              {/* Branch Principal (isMain) */}
              <div className="flex items-start gap-3 p-3.5 bg-[#F7F7F5] rounded-xl border border-[#D9D9D2]/40 mt-2">
                <input
                  type="checkbox"
                  id="isMain"
                  {...register('isMain')}
                  className="mt-1 w-4 h-4 text-[#3F3F3F] border-[#D9D9D2] rounded focus:ring-[#3F3F3F] cursor-pointer"
                />
                <div className="space-y-0.5">
                  <label htmlFor="isMain" className="text-sm font-semibold text-[#3F3F3F] cursor-pointer">
                    Sucursal Principal
                  </label>
                  <p className="text-[11px] text-[#6B6B6B] leading-normal">
                    Identifica a esta sucursal como la fuente principal de stock para el e-commerce. Al marcarla, las demás sucursales se desmarcarán automáticamente.
                  </p>
                </div>
              </div>

              {/* IGV Exempt (igvExempt) */}
              <div className="flex items-start gap-3 p-3.5 bg-[#F7F7F5] rounded-xl border border-[#D9D9D2]/40">
                <input
                  type="checkbox"
                  id="igvExempt"
                  {...register('igvExempt')}
                  className="mt-1 w-4 h-4 text-emerald-600 border-[#D9D9D2] rounded focus:ring-emerald-500 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <label htmlFor="igvExempt" className="text-sm font-semibold text-[#3F3F3F] cursor-pointer">
                    Exonerada de IGV (Zona Selva / Amazonía)
                  </label>
                  <p className="text-[11px] text-[#6B6B6B] leading-normal">
                    Activa si la sucursal opera en una zona exonerada de IGV (Ley 27037). El POS no aplicará el desglose del 18% en las ventas de esta sucursal.
                  </p>
                </div>
              </div>
            </div>

            {/* Atomic Transaction Note */}
            <div className="hidden lg:block p-3.5 bg-[#F7F7F5] rounded-xl border border-[#D9D9D2]/40 mt-6 text-xs text-[#6B6B6B] leading-relaxed">
              <span className="font-semibold text-[#3F3F3F]">Información Importante:</span> La creación de la sucursal disparará automáticamente la creación de su **Almacén Independiente** 1:1 en una transacción única. No es necesario realizar configuraciones de inventario adicionales.
            </div>
          </form>

          {/* Right Map Section */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            
            {/* Map Action Bar */}
            <div className="flex flex-col sm:flex-row gap-2">
              <form 
                onSubmit={handleMapSearchSubmit}
                className="flex-1 flex gap-2"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar ciudad, calle o plaza..."
                    className="w-full pl-8 pr-3 py-1.5 bg-[#F7F7F5] border border-[#D9D9D2] rounded-lg outline-none text-xs focus:border-[#3F3F3F] text-[#3F3F3F]"
                  />
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#6B6B6B]/60">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={searchingLocation}
                  className="bg-[#D9D9D2]/70 hover:bg-[#D9D9D2] text-[#3F3F3F] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 flex items-center gap-1"
                >
                  {searchingLocation ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <span>Ubicar</span>
                  )}
                </button>
              </form>
            </div>

            {/* Map Container */}
            <div className="relative h-64 lg:h-[350px] bg-[#F7F7F5] rounded-2xl border border-[#D9D9D2] overflow-hidden shadow-inner group">
              <div 
                ref={mapContainerRef} 
                className="w-full h-full z-10"
              />

              {/* Loaders overlay */}
              {(mapLoading || searchingLocation) && (
                <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[1px] flex items-center justify-center transition-all duration-200">
                  <div className="flex items-center gap-2 px-3.5 py-2 bg-white rounded-full shadow-md border border-[#D9D9D2]/40">
                    <Loader2 className="w-4 h-4 animate-spin text-[#3F3F3F]" />
                    <span className="text-xs text-[#3F3F3F] font-semibold tracking-wide">
                      {searchingLocation ? 'Buscando coordenadas...' : 'Geocodificando...'}
                    </span>
                  </div>
                </div>
              )}

              {/* Map Floating Tips */}
              <div className="absolute bottom-2 left-2 z-20 bg-[#3F3F3F]/95 text-white py-1 px-2.5 rounded-lg shadow text-[10px] pointer-events-none backdrop-blur-sm">
                Map: OpenStreetMap &copy; Leaflet
              </div>
            </div>
            
            <p className="text-[11px] text-[#6B6B6B] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3F3F3F] inline-block animate-ping"></span>
              <span>Puedes arrastrar el pin o hacer clic en cualquier parte del mapa para ajustar la dirección comercial.</span>
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#D9D9D2]/40 bg-[#F7F7F5]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-[#3F3F3F] font-semibold hover:bg-[#D9D9D2]/40 rounded-xl transition-colors duration-200 text-sm"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            form="branch-form"
            disabled={submitting || mapLoading}
            className="bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 text-white font-semibold px-6 py-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {editingBranch ? 'Actualizar Sucursal' : 'Crear Sucursal'}
          </button>
        </div>

      </div>
    </div>
  );
};
