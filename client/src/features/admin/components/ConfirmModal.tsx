import React, { useEffect } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isLoading = false,
  onConfirm,
  onCancel,
  children,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Blur whatever was focused in the background so keyboard events don't leak
      (document.activeElement as HTMLElement)?.blur();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-[#D9D9D2]/40"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        {/* Header with Visual Indicator */}
        <div className="p-6 pb-4 flex items-start gap-4">
          <div className="p-3 bg-[#FAFAFA] rounded-full text-[#3F3F3F] border border-[#D9D9D2]/40 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 id="confirm-modal-title" className="text-xl font-bold text-[#3F3F3F]">
              {title}
            </h2>
            <p className="text-sm text-[#6B6B6B] mt-2 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Extra content (e.g. email inputs) */}
        {children && (
          <div className="px-6 pb-4">
            {children}
          </div>
        )}

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-[#FAFAFA] flex gap-3 justify-end border-t border-[#D9D9D2]/40">
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="px-4 py-2 text-[#3F3F3F] font-bold hover:bg-[#D9D9D2]/20 rounded-xl transition-all duration-200 disabled:opacity-50 text-sm cursor-pointer border border-[#D9D9D2]/40 bg-white"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className="bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 text-[#F7F7F5] font-bold px-5 py-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 text-sm shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
