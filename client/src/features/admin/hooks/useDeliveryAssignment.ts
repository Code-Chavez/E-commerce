import { useState } from 'react';
import { logisticsService } from '../services/logistics.service';
import type { Delivery } from '../types/logistics.types';
import toast from 'react-hot-toast';

export const useDeliveryAssignment = (
  updateDeliveryState: (deliveryId: number, deliveryManId: number, status: Delivery['status']) => void
) => {
  const [assigningId, setAssigningId] = useState<number | null>(null);

  const assignDeliveryMan = async (deliveryId: number, deliveryManId: number) => {
    setAssigningId(deliveryId);
    try {
      // POST /api/v1/logistics/deliveries/:id/assign
      const updatedDelivery = await logisticsService.assignDeliveryMan(deliveryId, deliveryManId);
      
      // Actualizar estado global o del componente padre
      updateDeliveryState(deliveryId, updatedDelivery.deliveryManId as number, updatedDelivery.status);
      toast.success('Repartidor asignado exitosamente.');
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Error al asignar repartidor';
      toast.error(`Error: ${msg}`);
    } finally {
      setAssigningId(null);
    }
  };

  const downloadLabel = async (deliveryId: number) => {
    try {
      toast.loading('Generando etiqueta...', { id: `label-${deliveryId}` });
      await logisticsService.downloadShippingLabel(deliveryId);
      toast.success('Etiqueta descargada.', { id: `label-${deliveryId}` });
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Error al descargar etiqueta';
      toast.error(`Error: ${msg}`, { id: `label-${deliveryId}` });
    }
  };

  return {
    assignDeliveryMan,
    downloadLabel,
    assigningId
  };
};
