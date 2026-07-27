import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { User, MapPin, ChevronRight, ShoppingBag, BookOpen } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import toast from 'react-hot-toast';

export const ProfileLayout = () => {
  const { profile, isLoading, isUpdating, fetchProfile, updateProfile } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile().catch((err) => {
      toast.error(err.message || 'Error al obtener los datos del perfil');
    });
  }, [fetchProfile]);

  if (isLoading && !profile) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-brand-accent border-t-brand-primary/40 rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-brand-accent animate-pulse">Cargando cuenta...</span>
        </div>
      </div>
    );
  }

  const userInitial = profile?.name ? profile.name.charAt(0).toUpperCase() : '';
  const userFullName = profile ? `${profile.name} ${profile.lastName || ''}` : 'Usuario';

  return (
    <div className="min-h-screen bg-brand-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-brand-primary/20">
          <div>
            <h1 className="text-3xl font-extrabold text-brand-accent tracking-tight">Mi Cuenta</h1>
            <p className="mt-1 text-sm text-brand-text">Gestiona tu información personal y direcciones de envío</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 border border-brand-primary rounded-xl text-brand-text hover:bg-brand-primary/20 hover:text-brand-accent transition-all duration-300 font-bold text-xs self-start sm:self-center"
          >
            Volver a la Tienda
          </button>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="md:col-span-1 space-y-6">
            {/* User card info */}
            <div className="bg-white rounded-2xl p-6 border border-brand-primary/30 shadow-sm flex flex-col items-center text-center">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={userFullName}
                  className="w-20 h-20 rounded-full object-cover border-2 border-brand-primary/40 mb-3"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-accent text-3xl font-bold mb-3 border-2 border-brand-primary/40">
                  {userInitial}
                </div>
              )}
              <h3 className="font-extrabold text-brand-accent truncate max-w-full text-base">{userFullName}</h3>
              <p className="text-xs text-brand-text truncate max-w-full mt-0.5">{profile?.email}</p>
            </div>

            {/* Navigation links */}
            <nav className="bg-white rounded-2xl p-3 border border-brand-primary/30 shadow-sm flex flex-col gap-1">
              <NavLink
                to="/profile"
                end
                className={({ isActive }) =>
                  `flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                    isActive
                      ? 'bg-brand-accent text-white shadow-sm'
                      : 'text-brand-text hover:bg-brand-primary/10 hover:text-brand-accent'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4" />
                  <span>Mis Datos</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </NavLink>

              <NavLink
                to="/profile/addresses"
                className={({ isActive }) =>
                  `flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                    isActive
                      ? 'bg-brand-accent text-white shadow-sm'
                      : 'text-brand-text hover:bg-brand-primary/10 hover:text-brand-accent'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4" />
                  <span>Mis Direcciones</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </NavLink>

              <NavLink
                to="/profile/orders"
                className={({ isActive }) =>
                  `flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                    isActive
                      ? 'bg-brand-accent text-white shadow-sm'
                      : 'text-brand-text hover:bg-brand-primary/10 hover:text-brand-accent'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Mis Pedidos</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </NavLink>

              <NavLink
                to="/profile/complaints"
                className={({ isActive }) =>
                  `flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                    isActive
                      ? 'bg-brand-accent text-white shadow-sm'
                      : 'text-brand-text hover:bg-brand-primary/10 hover:text-brand-accent'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-4 h-4" />
                  <span>Reclamaciones</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </NavLink>
            </nav>
          </div>

          {/* Child Routes Outlet */}
          <div className="md:col-span-3">
            <Outlet context={{ profile, isLoading, isUpdating, fetchProfile, updateProfile }} />
          </div>
        </div>
      </div>
    </div>
  );
};
