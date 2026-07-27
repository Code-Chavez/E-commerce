import { MapPin, Pencil, Trash2, Star } from 'lucide-react';
import type { Address } from '../types/address.types';

interface AddressCardProps {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (id: number) => void;
  onSetDefault: (id: number) => void;
}

export const AddressCard = ({
  address,
  onEdit,
  onDelete,
  onSetDefault,
}: AddressCardProps) => {
  return (
    <div
      className={`bg-white rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between gap-4 min-h-[200px] relative overflow-hidden group ${
        address.isDefault
          ? 'border-brand-accent shadow-md ring-1 ring-brand-accent/10'
          : 'border-brand-primary/30 shadow-sm hover:shadow-md hover:border-brand-accent/50'
      }`}
    >
      {/* Decorative Default Accent Line */}
      {address.isDefault && (
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-brand-accent" />
      )}

      {/* Card Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-xl transition-colors duration-300 ${
              address.isDefault ? 'bg-brand-accent/10 text-brand-accent' : 'bg-brand-primary/20 text-brand-text group-hover:text-brand-accent'
            }`}
          >
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-brand-accent text-base truncate max-w-[150px] sm:max-w-[200px]">
              {address.alias}
            </h4>
            <span className="text-[10px] text-brand-text/60 font-semibold">
              Distrito de {address.district}
            </span>
          </div>
        </div>

        {address.isDefault ? (
          <span className="flex items-center gap-1 bg-brand-accent/10 text-brand-accent px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
            <Star className="w-3 h-3 fill-current" />
            <span>Predeterminada</span>
          </span>
        ) : (
          <button
            onClick={() => onSetDefault(address.id)}
            className="text-[10px] font-black uppercase tracking-wider text-brand-text hover:text-brand-accent border border-brand-primary/60 hover:border-brand-accent px-2.5 py-1 rounded-full transition-all duration-300"
          >
            Establecer Principal
          </button>
        )}
      </div>

      {/* Card Body */}
      <div className="flex-1 space-y-1.5 py-1">
        <p className="text-sm font-semibold text-brand-accent/95 leading-relaxed">
          {address.fullAddress}
        </p>
        {address.reference && (
          <p className="text-xs text-brand-text/80 bg-brand-bg/50 px-3 py-2 rounded-xl border border-brand-primary/10 italic">
            Ref: {address.reference}
          </p>
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-primary/10">
        <button
          onClick={() => onEdit(address)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-brand-text hover:text-brand-accent hover:bg-brand-primary/10 rounded-xl transition-all duration-300"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>Editar</span>
        </button>
        
        {/* Only allow deletion if it is NOT the default address (backend does not allow deleting unique or default address) */}
        {!address.isDefault && (
          <button
            onClick={() => onDelete(address.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-300"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar</span>
          </button>
        )}
      </div>
    </div>
  );
};
