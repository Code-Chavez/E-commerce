import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { KanbanBoard } from './components/deliveries/KanbanBoard';
import { DeliveryDetailPanel } from './components/deliveries/DeliveryDetailPanel';
import { useDeliveries } from './hooks/useDeliveries';
import { useDeliveryAssignment } from './hooks/useDeliveryAssignment';
import { Truck, Loader2 } from 'lucide-react';
import type { Delivery, DeliveryMan } from './types/logistics.types';
import { logisticsService } from './services/logistics.service';

const DeliveriesPage: React.FC = () => {
  const [deliveryMen, setDeliveryMen] = useState<DeliveryMan[]>([]);
  const [isLoadingDeliveryMen, setIsLoadingDeliveryMen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  const { 
    deliveries, 
    setDeliveries, 
    isLoading, 
    error, 
    fetchDeliveries 
  } = useDeliveries();

  // Load deliveries on mount
  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  // Load delivery men on mount
  useEffect(() => {
    const fetchDeliveryMen = async () => {
      setIsLoadingDeliveryMen(true);
      try {
        const data = await logisticsService.getDeliveryMen();
        setDeliveryMen(data);
      } catch (err) {
        console.error('Error fetching delivery men', err);
      } finally {
        setIsLoadingDeliveryMen(false);
      }
    };
    fetchDeliveryMen();
  }, []);

  const updateDeliveryState = (deliveryId: number, deliveryManId: number, status: Delivery['status']) => {
    setDeliveries((prev) => 
      prev.map(d => d.id === deliveryId ? { ...d, deliveryManId, status } : d)
    );
    // If the currently open detail panel is the modified delivery, update it too
    setSelectedDelivery((prev) => 
      prev && prev.id === deliveryId ? { ...prev, deliveryManId, status } : prev
    );
  };

  const { assignDeliveryMan, downloadLabel, assigningId } = useDeliveryAssignment(updateDeliveryState);

  const handleUpdateStatus = async (deliveryId: number, status: Delivery['status']) => {
    const updated = await logisticsService.updateDeliveryStatus(deliveryId, status);
    setDeliveries((prev) => 
      prev.map(d => d.id === deliveryId ? { ...d, ...updated } : d)
    );
    setSelectedDelivery((prev) => 
      prev && prev.id === deliveryId ? { ...prev, ...updated } : prev
    );
  };

  const handleAssignDriver = async (deliveryId: number, deliveryManId: number) => {
    await assignDeliveryMan(deliveryId, deliveryManId);
  };

  const handleCardClick = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setIsDetailOpen(true);
  };

  return (
    <>
      <Helmet>
        <title>Control de Despachos | Admin D'Mendoza</title>
      </Helmet>
      
      <div className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm font-semibold shadow-sm animate-fade-in">
            {error}
          </div>
        )}

        {/* Header Info */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-gray-100/50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100/50 text-indigo-600 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Control de Despachos</h2>
              <p className="text-xs text-gray-500 font-semibold mt-0.5">
                Tablero Kanban para la gestión del ciclo de vida de los envíos con trazabilidad en tiempo real.
              </p>
            </div>
          </div>
        </div>

        {isLoading || isLoadingDeliveryMen ? (
          <div className="flex justify-center items-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-gray-100/50 shadow-sm">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="relative">
            <KanbanBoard
              deliveries={deliveries}
              deliveryMen={deliveryMen}
              onUpdateStatus={handleUpdateStatus}
              onAssignDriver={handleAssignDriver}
              onCardClick={handleCardClick}
              onDeliveryUpdated={(deliveryId, updates) => {
                setDeliveries(prev => prev.map(d => d.id === deliveryId ? { ...d, ...updates } : d));
                setSelectedDelivery(prev => prev && prev.id === deliveryId ? { ...prev, ...updates } : prev);
              }}
            />
            
            <DeliveryDetailPanel
              delivery={selectedDelivery}
              isOpen={isDetailOpen}
              onClose={() => {
                setIsDetailOpen(false);
                setSelectedDelivery(null);
              }}
              deliveryMen={deliveryMen}
              onDownloadLabel={downloadLabel}
              assigningId={assigningId}
              onDeliveryUpdated={(deliveryId, updates) => {
                setDeliveries(prev => prev.map(d => d.id === deliveryId ? { ...d, ...updates } : d));
                setSelectedDelivery(prev => prev && prev.id === deliveryId ? { ...prev, ...updates } : prev);
              }}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default DeliveriesPage;
