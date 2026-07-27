import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/context/AuthContext';
import { usePos } from '@/features/pos/context/PosContext';
import { Store, LogOut, ChevronDown, User, Landmark, ArrowLeft } from 'lucide-react';
import logoHorizontal from '@/assets/logo-horizontal.png';

export const PosShell: React.FC = () => {
  const { user, logout } = useAuth();
  const { isOpen, activeRegister } = usePos();
  const navigate = useNavigate();

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-[#FAFAFA] print:bg-white flex flex-col font-sans antialiased text-[#3F3F3F]">
      
      {/* POS Topbar Header */}
      <header className="bg-white border-b border-[#D9D9D2]/40 h-16 shrink-0 flex items-center justify-between px-6 shadow-sm sticky top-0 z-40 print:hidden">
        
        {/* Left Section: Logo & Quick Active Session Badge */}
        <div className="flex items-center gap-4">
          <Link to={isOpen ? '/pos' : '/pos/open-cash'} className="flex items-center gap-2">
            <img src={logoHorizontal} alt="D'Mendoza" className="h-7 w-auto object-contain" />
            <span className="text-[10px] font-extrabold text-[#3F3F3F]/80 uppercase tracking-widest bg-[#FAFAFA] px-2 py-1 rounded-md border border-[#D9D9D2]/30 shadow-sm hidden sm:inline-block">
              POS
            </span>
          </Link>

          {/* Active Shift Indicator */}
          {isOpen && activeRegister && (
            <div className="hidden md:flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200/50 rounded-xl">
                <Landmark className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-800">
                  {activeRegister.name} (Abierta)
                </span>
              </div>
              <Link 
                to="/pos/turn/sales" 
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D9D9D2] hover:bg-[#FAFAFA] text-[#3F3F3F] text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                Ventas del Turno
              </Link>
              <Link 
                to="/pos/turn/close" 
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                Cerrar Turno
              </Link>
            </div>
          )}
        </div>

        {/* Right Section: Return to Admin Panel, Notifications, User Dropdown */}
        <div className="flex items-center gap-4">
          
          {/* Conditional Admin return button */}
          {isAdmin && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D9D9D2] hover:bg-[#FAFAFA] text-xs font-bold text-[#3F3F3F] transition-all"
              title="Volver al Panel Administrativo"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver al Panel</span>
            </Link>
          )}

          {/* User profile dropdown menu */}
          <div className="relative">
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-[#FAFAFA] rounded-xl transition-all border border-transparent hover:border-[#D9D9D2]/30"
            >
              <div className="w-7 h-7 rounded-full bg-[#3F3F3F] flex items-center justify-center text-[#FAFAFA] font-bold text-xs">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="hidden md:inline text-xs font-semibold text-[#3F3F3F] max-w-[120px] truncate">
                {user?.email}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#6B6B6B]" />
            </button>

            {isUserDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white border border-[#D9D9D2]/40 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="p-3 border-b border-[#D9D9D2]/40 bg-[#FAFAFA]">
                  <span className="block text-xs font-extrabold text-[#3F3F3F] truncate">{user?.email}</span>
                  <span className="block text-[10px] text-[#6B6B6B] mt-0.5 uppercase tracking-wider font-semibold">
                    {user?.role || 'Vendedor'}
                  </span>
                </div>

                <div className="p-1.5 space-y-0.5">
                  
                  {/* Public Store link */}
                  <Link
                    to="/"
                    onClick={() => setIsUserDropdownOpen(false)}
                    className="w-full flex items-center gap-2 text-left p-2.5 hover:bg-[#FAFAFA] text-xs font-bold text-[#3F3F3F] rounded-lg transition-colors"
                  >
                    <Store className="w-4 h-4 text-[#6B6B6B]" />
                    <span>Ver Tienda</span>
                  </Link>

                  {/* Profile Edit */}
                  <Link
                    to={isAdmin ? '/admin/profile' : '/profile'}
                    onClick={() => setIsUserDropdownOpen(false)}
                    className="w-full flex items-center gap-2 text-left p-2.5 hover:bg-[#FAFAFA] text-xs font-bold text-[#3F3F3F] rounded-lg transition-colors"
                  >
                    <User className="w-4 h-4 text-[#6B6B6B]" />
                    <span>Mi Perfil</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 text-left p-2.5 hover:bg-red-50 hover:text-red-700 text-xs font-bold text-[#3F3F3F] rounded-lg transition-colors border-t border-[#D9D9D2]/20 mt-1"
                  >
                    <LogOut className="w-4 h-4 text-red-500 shrink-0" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </header>

      {/* POS Sub-routes Child Content Area */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

    </div>
  );
};

export default PosShell;
