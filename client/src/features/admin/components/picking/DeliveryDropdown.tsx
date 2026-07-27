import React from 'react';
import { Loader2 } from 'lucide-react';
import type { DeliveryMan } from '../../types/logistics.types';

interface DeliveryDropdownProps {
  deliveryId: number;
  currentDeliveryManId: number | null;
  deliveryMen: DeliveryMan[];
  onAssign: (deliveryId: number, deliveryManId: number) => void;
  isLoading?: boolean;
}

export const DeliveryDropdown: React.FC<DeliveryDropdownProps> = ({
  deliveryId,
  currentDeliveryManId,
  deliveryMen,
  onAssign,
  isLoading = false
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value) {
      onAssign(deliveryId, Number(value));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={currentDeliveryManId || ''}
        onChange={handleChange}
        disabled={isLoading}
        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md disabled:bg-gray-100"
      >
        <option value="" disabled>Seleccione repartidor</option>
        {deliveryMen.map((man) => (
          <option key={man.id} value={man.id}>
            {man.name}
          </option>
        ))}
      </select>
      {isLoading && <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />}
    </div>
  );
};
