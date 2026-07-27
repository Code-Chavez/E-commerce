import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Map, Loader2, ChevronDown, ChevronUp, Package, Clock, DollarSign } from 'lucide-react';
import { logisticsService } from './services/logistics.service';
import type { DeliveriesByZoneGroup } from './types/logistics.types';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);
};

export default function DeliveriesByZonePage() {
  const [groups, setGroups] = useState<DeliveriesByZoneGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedZones, setExpandedZones] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setIsLoading(true);
        const data = await logisticsService.getPendingDeliveriesByZone();
        setGroups(data);
      } catch (err) {
        setError('Error al cargar agrupaciones por zona.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGroups();
  }, []);

  const toggleZone = (zoneId: number) => {
    const next = new Set(expandedZones);
    if (next.has(zoneId)) {
      next.delete(zoneId);
    } else {
      next.add(zoneId);
    }
    setExpandedZones(next);
  };

  return (
    <>
      <Helmet>
        <title>Entregas por Zona | Admin D'Mendoza</title>
      </Helmet>

      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <Map className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Agrupación por Zona de Entrega</h2>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Visualiza los pedidos pendientes agrupados por su zona geográfica correspondiente.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm font-semibold shadow-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-sm">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-sm">
            <Map className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No hay entregas pendientes en este momento.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => {
              const isExpanded = expandedZones.has(group.zone.id);
              const zoneName = group.zone.name || `Zona ID: ${group.zone.id}`;
              const districtsList = group.zone.districts.join(', ');

              return (
                <div key={group.zone.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-200">
                  {/* Zone Header (Clickable) */}
                  <div
                    onClick={() => toggleZone(group.zone.id)}
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50/80 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-50/50 flex items-center justify-center border border-blue-100 text-blue-600">
                        <Map className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {zoneName}
                        </h3>
                        <p className="text-sm text-gray-500 font-medium max-w-xl truncate" title={districtsList}>
                          {districtsList || 'Sin distritos'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="hidden sm:flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span>{group.count} Pendientes</span>
                        </div>
                        {group.zone.id !== 0 && (
                          <>
                            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                              <DollarSign className="w-4 h-4 text-gray-400" />
                              <span>{formatCurrency(group.zone.deliveryCost)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span>{group.zone.estimatedDays} días</span>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="p-5 border-t border-gray-100 bg-gray-50/30">
                      <div className="grid gap-3">
                        {group.deliveries.map((delivery) => (
                          <div key={delivery.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900">#ORD-{delivery.orderId.toString().padStart(4, '0')}</span>
                                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-xs font-semibold border border-amber-100">
                                  {delivery.status}
                                </span>
                              </div>
                              <span className="text-sm text-gray-500 mt-1 font-medium">
                                Cliente: {delivery.orderUser?.name} ({delivery.orderUser?.email})
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                              <span className="font-semibold text-gray-800">Dirección:</span> {delivery.orderAddress?.fullAddress}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
