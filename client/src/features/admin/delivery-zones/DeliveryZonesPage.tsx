import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axiosInstance from '@/shared/api/axiosInstance';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { DeliveryZoneModal } from './components/DeliveryZoneModal';

export interface DeliveryZone {
  id: number;
  districts: string[];
  deliveryCost: number;
  estimatedDays: number;
}

const DeliveryZonesPage = () => {
  useDocumentTitle('Administrar Zonas de Envío');
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);

  const fetchZones = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/v1/admin/delivery-zones');
      setZones(res.data);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar zonas de envío');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar esta zona de envío?')) return;
    try {
      await axiosInstance.delete(`/v1/admin/delivery-zones/${id}`);
      toast.success('Zona de envío eliminada');
      fetchZones();
    } catch (error) {
      toast.error('Error al eliminar la zona de envío');
    }
  };

  const handleOpenModal = (zone?: DeliveryZone) => {
    setSelectedZone(zone || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = (refresh?: boolean) => {
    setIsModalOpen(false);
    setSelectedZone(null);
    if (refresh) fetchZones();
  };

  const filteredZones = zones.filter(zone => 
    zone.id.toString().includes(searchTerm) ||
    zone.districts.some(d => d.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Zonas de Envío</h1>
          <p className="text-gray-500 text-sm mt-1">Configura las tarifas y tiempos de delivery por distrito.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-brand-accent text-white px-4 py-2 rounded-lg hover:bg-black transition flex items-center gap-2"
        >
          <Plus size={18} />
          Nueva Zona
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por zona o distrito..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Zona</th>
                <th className="px-6 py-4">Distritos</th>
                <th className="px-6 py-4">Tarifa (S/)</th>
                <th className="px-6 py-4">Días Estimados</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-accent"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredZones.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No se encontraron zonas de envío.
                  </td>
                </tr>
              ) : (
                filteredZones.map(zone => (
                  <tr key={zone.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      Zona #{zone.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {zone.districts.map(dist => (
                          <span key={dist} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                            <MapPin size={10} />
                            {dist}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-brand-accent">
                      S/ {Number(zone.deliveryCost).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {zone.estimatedDays} {zone.estimatedDays === 1 ? 'día' : 'días'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(zone)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(zone.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <DeliveryZoneModal 
          zone={selectedZone} 
          onClose={handleCloseModal} 
        />
      )}
    </div>
  );
};

export default DeliveryZonesPage;
