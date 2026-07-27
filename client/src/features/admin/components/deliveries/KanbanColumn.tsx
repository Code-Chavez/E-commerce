import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { Delivery, DeliveryMan } from '../../types/logistics.types';
import { KanbanCard } from './KanbanCard';
import { getStatusStyle } from '../../../../shared/utils/statusColors';

interface KanbanColumnProps {
  status: Delivery['status'];
  deliveries: Delivery[];
  deliveryMen: DeliveryMan[];
  onCardClick: (delivery: Delivery) => void;
  isDragActive: boolean;
  isValidDropTarget: boolean;
  isOverThisColumn: boolean;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  deliveries,
  deliveryMen,
  onCardClick,
  isDragActive,
  isValidDropTarget,
  isOverThisColumn
}) => {
  const { setNodeRef } = useDroppable({
    id: status,
  });

  const statusStyle = getStatusStyle(status);

  // Column is grayed out if there is an active drag but this column is NOT a valid drop target
  const isDisabled = isDragActive && !isValidDropTarget;
  // Highlighting valid drop target columns with a subtle border/glow
  const isHighlighted = isDragActive && isValidDropTarget;

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-72 shrink-0 rounded-2xl p-4 transition-all duration-300 border-2
        ${isOverThisColumn && isValidDropTarget 
          ? 'bg-emerald-50/40 border-emerald-500/40 shadow-md ring-2 ring-emerald-500/20' 
          : isHighlighted 
            ? 'bg-indigo-50/20 border-indigo-400/40 shadow-sm border-dashed'
            : isDisabled 
              ? 'bg-gray-100/30 border-gray-200/50 opacity-40 grayscale' 
              : 'bg-gray-50/60 border-transparent'
        }
      `}
    >
      {/* Column Header */}
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200/40">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${statusStyle.badge}`} />
          <h3 className="font-extrabold text-sm text-gray-800 tracking-tight">
            {statusStyle.label}
          </h3>
        </div>
        <span className="text-[11px] font-black bg-gray-200/60 text-gray-600 px-2.5 py-0.5 rounded-full">
          {deliveries.length}
        </span>
      </div>

      {/* Cards List container */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1 max-h-[calc(100vh-320px)] min-h-[250px]">
        {deliveries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 border border-dashed border-gray-200 rounded-xl bg-white/20">
            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
              Vacío
            </span>
          </div>
        ) : (
          deliveries.map((delivery) => (
            <KanbanCard
              key={delivery.id}
              delivery={delivery}
              deliveryMen={deliveryMen}
              onClick={onCardClick}
              isOverInvalidTarget={isDragActive && !isValidDropTarget}
            />
          ))
        )}
      </div>
    </div>
  );
};
