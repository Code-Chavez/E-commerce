import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, User, Eye, RotateCcw } from 'lucide-react';
import type { Delivery, DeliveryMan } from '../../types/logistics.types';
import { getStatusStyle } from '../../../../shared/utils/statusColors';

interface KanbanCardProps {
  delivery: Delivery;
  deliveryMen: DeliveryMan[];
  onClick: (delivery: Delivery) => void;
  isOverInvalidTarget: boolean;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ 
  delivery, 
  deliveryMen, 
  onClick, 
  isOverInvalidTarget 
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: delivery.id.toString(),
    data: {
      delivery
    }
  });

  const isPickup = delivery.type === 'PICKUP';
  const statusStyle = getStatusStyle(delivery.status);
  const assignedDriver = deliveryMen.find(m => m.id === delivery.deliveryManId);

  // Apply CSS transform during drag
  const style = {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 50 : undefined,
  };

  // Check if we need to show the invalid target styling (grayed out)
  const isGrayedOut = isDragging && isOverInvalidTarget;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`group relative p-4 mb-3 rounded-2xl border transition-all duration-300 select-none bg-white/70 shadow-sm hover:shadow-md 
        ${isGrayedOut 
          ? 'bg-gray-100/50 border-gray-300/40 opacity-40 grayscale pointer-events-none' 
          : `${statusStyle.bg} ${statusStyle.border} ${statusStyle.glow}`
        }
        ${isDragging ? 'cursor-grabbing scale-105 border-dashed border-2' : 'cursor-grab'}
      `}
    >
      {/* Pickup badge */}
      {isPickup && (
        <div className="flex items-center gap-1 mb-2 px-2 py-1 bg-purple-50 border border-purple-200 rounded-lg w-fit">
          <RotateCcw className="w-3 h-3 text-purple-600" />
          <span className="text-[10px] font-extrabold text-purple-700 uppercase tracking-wider">Recojo</span>
        </div>
      )}

      {/* Top row: ID and View Button */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-black tracking-wider opacity-60">
          {isPickup ? 'RECOJO' : 'ENVÍO'} #{delivery.id}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick(delivery);
          }}
          className="p-1.5 rounded-lg bg-white hover:bg-gray-100 border border-gray-100 text-gray-500 hover:text-black transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Drag Handle / Trigger Zone */}
      <div {...listeners} className="space-y-3">
        <div className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          <span>{new Date(delivery.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        {/* Assigned delivery man status */}
        <div className="pt-2 border-t border-gray-100/50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-[11px] text-gray-500 font-semibold truncate">
            <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate">
              {assignedDriver ? assignedDriver.name : 'Sin repartidor'}
            </span>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${statusStyle.badge}`}>
            {statusStyle.label}
          </span>
        </div>
      </div>
    </div>
  );
};
