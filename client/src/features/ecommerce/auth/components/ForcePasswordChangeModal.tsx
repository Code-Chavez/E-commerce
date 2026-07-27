import React from 'react';
import { KeyRound, ArrowRight } from 'lucide-react';

interface ForcePasswordChangeModalProps {
  isOpen: boolean;
  onConfirm: () => void;
}

export const ForcePasswordChangeModal: React.FC<ForcePasswordChangeModalProps> = ({
  isOpen,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-gray-100 animate-in zoom-in-95 duration-350">
        
        {/* Top visual accent */}
        <div className="h-2 bg-gradient-to-r from-amber-500 to-rose-500 w-full" />

        {/* Content Area */}
        <div className="p-8 text-center space-y-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-50 border border-amber-200 text-amber-600 animate-bounce">
            <KeyRound className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-brand-accent tracking-tight">
              Cambio de Contraseña Obligatorio
            </h2>
            <p className="text-xs font-bold text-amber-700 uppercase tracking-widest bg-amber-50 border border-amber-200/50 rounded-lg py-1 px-3 inline-block">
              Seguridad Omnicanal
            </p>
          </div>

          <div className="space-y-4 text-sm text-brand-text leading-relaxed">
            <p>
              Tu cuenta física ha sido vinculada desde nuestro punto de venta (POS) y actualmente cuenta con una contraseña temporal.
            </p>
            <p className="font-semibold text-brand-accent">
              Por motivos de seguridad, debes establecer una nueva contraseña definitiva en tu primer inicio de sesión web.
            </p>
            <p className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3 border border-gray-200/50 text-justify">
              <strong>Nota:</strong> Se ha enviado un correo de bienvenida con un enlace de activación. Si no lo recibiste o el enlace ya expiró, haz clic en el botón de abajo para generar uno nuevo e iniciar la actualización de forma segura.
            </p>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              onClick={onConfirm}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-extrabold text-white bg-brand-text hover:bg-brand-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>Actualizar Contraseña</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
