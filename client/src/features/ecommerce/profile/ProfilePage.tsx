import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import toast from 'react-hot-toast';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { Sparkles, Shield, User as UserIcon, Loader2 } from 'lucide-react';

import { useProfile, type ProfileDetails } from './hooks/useProfile';
import { useLoyalty } from './hooks/useLoyalty';
import { profileSchema, type ProfileFormData } from './schemas/profile.schema';
import { AvatarUpload } from './components/AvatarUpload';
import { PreferencesSection } from './components/PreferencesSection';

interface ProfileOutletContext {
  profile: ProfileDetails | null;
  isLoading: boolean;
  isUpdating: boolean;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: ProfileFormData, avatarFile?: File | null) => Promise<any>;
}

export const ProfilePage = () => {
  const outletCtx = useOutletContext<ProfileOutletContext>();
  const hookCtx = useProfile();
  const loyaltyHook = useLoyalty();

  const profile = outletCtx ? outletCtx.profile : hookCtx.profile;
  const isLoading = outletCtx ? outletCtx.isLoading : hookCtx.isLoading;
  const isUpdating = outletCtx ? outletCtx.isUpdating : hookCtx.isUpdating;
  const fetchProfile = outletCtx ? outletCtx.fetchProfile : hookCtx.fetchProfile;
  const updateProfile = outletCtx ? outletCtx.updateProfile : hookCtx.updateProfile;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      name: '',
      lastName: '',
      phone: '',
    },
  });

  // Fetch user profile on mount
  useEffect(() => {
    fetchProfile().catch((err) => {
      toast.error(err.message || 'Error al obtener los datos del perfil');
    });
    if (!isAdmin) {
      loyaltyHook.fetchBalance();
    }
  }, [fetchProfile]);

  // Reset form values once profile is loaded
  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile(data, selectedFile);
      setSelectedFile(null); // Clear selected file upon success
      toast.success('Perfil actualizado correctamente');
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar el perfil');
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${isAdmin ? 'py-20' : 'min-h-screen bg-[#FAFAFA]'}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-[#3F3F3F] border-t-[#D9D9D2] rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-[#3F3F3F] animate-pulse">Cargando perfil...</span>
        </div>
      </div>
    );
  }

  const content = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Left Column: Avatar upload */}
      <div className={`md:col-span-1 p-6 rounded-2xl flex flex-col justify-center items-center h-fit bg-white ${
        isAdmin ? 'border border-[#D9D9D2]/30 shadow-sm' : 'border border-brand-primary/40 shadow-sm'
      }`}>
        <AvatarUpload
          currentAvatarUrl={profile?.avatarUrl ?? null}
          name={profile?.name || ''}
          lastName={profile?.lastName || ''}
          selectedFile={selectedFile}
          onFileSelect={setSelectedFile}
        />
      </div>

      {/* Right Column: Editable Profile Fields Form */}
      <div className={`md:col-span-2 rounded-2xl p-6 sm:p-8 bg-white ${
        isAdmin ? 'border border-[#D9D9D2]/30 shadow-sm' : 'border border-brand-primary/40 shadow-sm'
      }`}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Visual Organizer Section 1 */}
          <div>
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-1 ${isAdmin ? 'text-[#3F3F3F]' : 'text-brand-accent'}`}>
              Información Personal
            </h3>
            <p className="text-xs text-[#6B6B6B] mb-4">
              Esta información se utilizará para personalizar tu firma y experiencia.
            </p>
            <div className={`h-[1px] mb-6 ${isAdmin ? 'bg-[#D9D9D2]/40' : 'bg-brand-primary/40'}`}></div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name Input */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className={`text-xs font-bold uppercase tracking-wider ${isAdmin ? 'text-[#3F3F3F]' : 'text-brand-accent'}`}>
                  Nombre
                </label>
                <input
                  id="name"
                  type="text"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-300 focus:outline-none focus:ring-2
                    ${isAdmin 
                      ? `bg-[#FAFAFA] text-[#3F3F3F] placeholder-[#6B6B6B]/40 focus:bg-white focus:ring-[#3F3F3F]/20 focus:border-[#3F3F3F] ${errors.name ? 'border-red-400 focus:ring-red-400/20' : 'border-[#D9D9D2]/70'}`
                      : `bg-brand-bg/10 text-brand-accent ${errors.name ? 'border-red-400 focus:ring-red-400' : 'border-brand-primary/60 focus:border-brand-accent'}`
                    }`}
                  placeholder="Ingresa tu nombre"
                  {...register('name')}
                />
                {errors.name && (
                  <span className="text-xs text-red-500 font-medium">{errors.name.message}</span>
                )}
              </div>

              {/* Last Name Input */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="lastName" className={`text-xs font-bold uppercase tracking-wider ${isAdmin ? 'text-[#3F3F3F]' : 'text-brand-accent'}`}>
                  Apellido
                </label>
                <input
                  id="lastName"
                  type="text"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-300 focus:outline-none focus:ring-2
                    ${isAdmin 
                      ? `bg-[#FAFAFA] text-[#3F3F3F] placeholder-[#6B6B6B]/40 focus:bg-white focus:ring-[#3F3F3F]/20 focus:border-[#3F3F3F] ${errors.lastName ? 'border-red-400 focus:ring-red-400/20' : 'border-[#D9D9D2]/70'}`
                      : `bg-brand-bg/10 text-brand-accent ${errors.lastName ? 'border-red-400 focus:ring-red-400' : 'border-brand-primary/60 focus:border-brand-accent'}`
                    }`}
                  placeholder="Ingresa tu apellido"
                  {...register('lastName')}
                />
                {errors.lastName && (
                  <span className="text-xs text-red-500 font-medium">{errors.lastName.message}</span>
                )}
              </div>
            </div>
          </div>

          {/* Visual Organizer Section 2 */}
          <div className="pt-4">
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-1 ${isAdmin ? 'text-[#3F3F3F]' : 'text-brand-accent'}`}>
              Contacto y Seguridad
            </h3>
            <p className="text-xs text-[#6B6B6B] mb-4">
              Credenciales de acceso y contacto registradas en D'Mendoza.
            </p>
            <div className={`h-[1px] mb-6 ${isAdmin ? 'bg-[#D9D9D2]/40' : 'bg-brand-primary/40'}`}></div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Phone Input */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="phone" className={`text-xs font-bold uppercase tracking-wider ${isAdmin ? 'text-[#3F3F3F]' : 'text-brand-accent'}`}>
                  Teléfono
                </label>
                <input
                  id="phone"
                  type="text"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-300 focus:outline-none focus:ring-2
                    ${isAdmin 
                      ? `bg-[#FAFAFA] text-[#3F3F3F] placeholder-[#6B6B6B]/40 focus:bg-white focus:ring-[#3F3F3F]/20 focus:border-[#3F3F3F] ${errors.phone ? 'border-red-400 focus:ring-red-400/20' : 'border-[#D9D9D2]/70'}`
                      : `bg-brand-bg/10 text-brand-accent ${errors.phone ? 'border-red-400 focus:ring-red-400' : 'border-brand-primary/60 focus:border-brand-accent'}`
                    }`}
                  placeholder="+51999888777"
                  {...register('phone')}
                />
                {errors.phone && (
                  <span className="text-xs text-red-500 font-medium">{errors.phone.message}</span>
                )}
              </div>

              {/* Email Input (Disabled / Safe Lock) */}
              <div className="flex flex-col gap-1.5">
                <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isAdmin ? 'text-[#3F3F3F]' : 'text-brand-accent'}`}>
                  Correo Electrónico
                  <Shield className="w-3.5 h-3.5 text-[#6B6B6B]" />
                </label>
                <input
                  type="email"
                  disabled
                  value={profile?.email || ''}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold cursor-not-allowed select-none
                    ${isAdmin 
                      ? 'border-[#D9D9D2]/40 bg-[#F7F7F5] text-[#6B6B6B]'
                      : 'border-brand-primary/40 bg-brand-bg/60 text-brand-text'
                    }`}
                />
                <span className="text-[10px] text-[#6B6B6B]">
                  El correo electrónico no puede ser modificado por seguridad de la cuenta.
                </span>
              </div>
            </div>
          </div>

          {/* Visual Organizer Section 3: Loyalty Points (Only for E-commerce) */}
          {!isAdmin && (
            <div className="pt-4">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-1 text-brand-accent flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                Mis Puntos D'Mendoza
              </h3>
              <p className="text-xs text-[#6B6B6B] mb-4">
                Puntos acumulados por tus compras. Úsalos como descuento en tu próximo pedido.
              </p>
              <div className="h-[1px] mb-6 bg-brand-primary/40"></div>

              <div className="bg-gradient-to-r from-yellow-50 to-amber-100 border border-yellow-200 p-6 rounded-2xl flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-xs font-bold text-yellow-800 uppercase tracking-widest mb-1">
                    Saldo Actual
                  </p>
                  <h4 className="text-3xl font-extrabold text-brand-accent">
                    {loyaltyHook.isLoading ? (
                      <span className="text-xl animate-pulse">Cargando...</span>
                    ) : (
                      `${loyaltyHook.account?.balance || 0} pts`
                    )}
                  </h4>
                </div>
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                </div>
              </div>
            </div>
          )}

          {/* Preferences Section */}
          {!isAdmin && <PreferencesSection profile={profile} />}

          {/* Action buttons */}
          <div className={`h-[1px] pt-4 ${isAdmin ? 'bg-[#D9D9D2]/40' : 'bg-brand-primary/40'}`}></div>
          
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                if (profile) {
                  reset({
                    name: profile.name,
                    lastName: profile.lastName || '',
                    phone: profile.phone || '',
                  });
                  setSelectedFile(null);
                  toast.success('Cambios revertidos');
                }
              }}
              disabled={!isDirty && !selectedFile}
              className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 border disabled:opacity-40 disabled:cursor-not-allowed
                ${isAdmin 
                  ? 'border-[#D9D9D2] hover:bg-[#FAFAFA] text-[#3F3F3F]' 
                  : 'border-brand-primary text-brand-text hover:bg-brand-primary/20 hover:text-brand-accent'
                }`}
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              disabled={isUpdating || (!isDirty && !selectedFile)}
              className={`px-5 py-2.5 text-xs font-bold rounded-xl focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2 shadow-sm
                ${isAdmin 
                  ? 'text-white bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 focus:ring-[#3F3F3F]/20' 
                  : 'text-white bg-brand-accent hover:bg-brand-accent/90 focus:ring-brand-accent focus:ring-offset-2'
                }`}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <UserIcon className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (isAdmin) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
        <div className="space-y-6">
          
          {/* Navigation / Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#D9D9D2]/40 pb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#3F3F3F]/80 uppercase tracking-widest mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Panel de Control</span>
              </div>
              <h1 className="text-3xl font-extrabold text-[#3F3F3F] tracking-tight">
                Mi Perfil
              </h1>
              <p className="text-sm text-[#6B6B6B] mt-1 max-w-xl">
                Administra tu información personal y foto de perfil dentro del portal administrativo de D'Mendoza.
              </p>
            </div>
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-2 px-4 py-2 border border-[#D9D9D2] bg-white text-[#3F3F3F] hover:bg-[#FAFAFA] rounded-xl transition-all duration-300 font-bold text-xs"
            >
              Volver al Panel
            </button>
          </div>

          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default ProfilePage;

