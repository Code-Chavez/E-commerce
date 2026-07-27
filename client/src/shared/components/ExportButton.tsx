import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { ExportModal } from './ExportModal';

interface ExportButtonProps {
  type: 'sales' | 'inventory' | 'clients';
  defaultFrom?: string;
  defaultTo?: string;
  className?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  type,
  defaultFrom,
  defaultTo,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 px-4 py-2 bg-white border border-[#D9D9D2] hover:bg-[#FAFAFA] text-[#3F3F3F] font-bold rounded-xl transition-all shadow-sm text-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${className}`}
        title="Exportar reporte en PDF, Excel o CSV"
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>Exportar</span>
      </button>

      <ExportModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        type={type}
        defaultFrom={defaultFrom}
        defaultTo={defaultTo}
      />
    </>
  );
};
