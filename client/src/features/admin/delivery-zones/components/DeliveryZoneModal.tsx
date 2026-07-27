import { useState, useEffect } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axiosInstance from '@/shared/api/axiosInstance';
import type { DeliveryZone } from '../DeliveryZonesPage';
import ubigeoData from '@/shared/data/ubigeo.json';

interface Props {
  zone: DeliveryZone | null;
  onClose: (refresh?: boolean) => void;
}

export const DeliveryZoneModal: React.FC<Props> = ({ zone, onClose }) => {
  const [formData, setFormData] = useState({
    deliveryCost: 0,
    estimatedDays: 1,
  });
  const [districts, setDistricts] = useState<string[]>([]);
  const [selectedDeptName, setSelectedDeptName] = useState('');
  const [selectedProvName, setSelectedProvName] = useState('');
  const [selectedDistName, setSelectedDistName] = useState('');
  const [loading, setLoading] = useState(false);

  // We are using the correct full structured JSON now which has a different format.
  // The geo-peru data is { departments: [...], provinces: [...], districts: [...] }
  // We need to filter it.
  const allDepartments = (ubigeoData as any).departments || [];
  const allProvinces = (ubigeoData as any).provinces || [];
  const allDistricts = (ubigeoData as any).districts || [];

  const departments = allDepartments;
  const provinces = allProvinces.filter((p: any) => p.department_id === departments.find((d: any) => d.name === selectedDeptName)?.id);
  const districtsData = allDistricts.filter((d: any) => d.province_id === provinces.find((p: any) => p.name === selectedProvName)?.id);

  useEffect(() => {
    if (zone) {
      setFormData({
        deliveryCost: Number(zone.deliveryCost),
        estimatedDays: zone.estimatedDays,
      });
      setDistricts(zone.districts);
    }
  }, [zone]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddDistrict = (e?: React.MouseEvent | React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!selectedDeptName || !selectedProvName || !selectedDistName) {
      toast.error('Selecciona un distrito válido');
      return;
    }

    const dist = `${selectedDeptName} | ${selectedProvName} | ${selectedDistName.trim()}`;

    if (districts.map(d => d.toLowerCase()).includes(dist.toLowerCase())) {
      toast.error('Este distrito ya está agregado');
      return;
    }

    setDistricts([...districts, dist]);
    setSelectedDistName('');
  };

  const handleRemoveDistrict = (distToRemove: string) => {
    setDistricts(districts.filter(d => d !== distToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (districts.length === 0) {
      toast.error('Debes agregar al menos un distrito');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        districts,
        deliveryCost: Number(formData.deliveryCost),
        estimatedDays: Number(formData.estimatedDays),
      };

      if (zone) {
        await axiosInstance.put(`/v1/admin/delivery-zones/${zone.id}`, payload);
        toast.success('Zona de envío actualizada');
      } else {
        await axiosInstance.post('/v1/admin/delivery-zones', payload);
        toast.success('Zona de envío creada exitosamente');
      }
      onClose(true);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Ocurrió un error al guardar la zona');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900">
            {zone ? 'Editar Zona de Envío' : 'Nueva Zona de Envío'}
          </h2>
          <button
            onClick={() => onClose()}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Costo de Envío (S/) *</label>
              <input
                type="number"
                name="deliveryCost"
                required
                min="0"
                step="0.01"
                value={formData.deliveryCost}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Días Estimados *</label>
              <input
                type="number"
                name="estimatedDays"
                required
                min="1"
                step="1"
                value={formData.estimatedDays}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Distritos Cubiertos *</label>
            <p className="text-xs text-gray-500 mb-2">Selecciona un distrito para agregarlo a la zona.</p>
            <div className="grid grid-cols-1 gap-2 mb-2 sm:grid-cols-3">
              <select 
                value={selectedDeptName} 
                onChange={(e) => { setSelectedDeptName(e.target.value); setSelectedProvName(''); setSelectedDistName(''); }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-accent outline-none bg-white text-sm"
              >
                <option value="">Departamento...</option>
                {departments.map((d: any) => <option key={d.name} value={d.name}>{d.name}</option>)}
              </select>
              <select 
                value={selectedProvName} 
                onChange={(e) => { setSelectedProvName(e.target.value); setSelectedDistName(''); }}
                disabled={!selectedDeptName}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-accent outline-none bg-white disabled:bg-gray-100 disabled:opacity-70 text-sm"
              >
                <option value="">Provincia...</option>
                {provinces.map((p: any) => <option key={p.name} value={p.name}>{p.name}</option>)}
              </select>
              <div className="flex gap-2">
                <select 
                  value={selectedDistName} 
                  onChange={(e) => setSelectedDistName(e.target.value)}
                  disabled={!selectedProvName}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-accent outline-none bg-white disabled:bg-gray-100 disabled:opacity-70 text-sm"
                >
                  <option value="">Distrito...</option>
                  {districtsData.map((d: any) => <option key={d.name} value={d.name}>{d.name}</option>)}
                </select>
                <button
                  type="button"
                  onClick={handleAddDistrict}
                  disabled={!selectedDistName}
                  className="px-3 py-2 bg-brand-accent text-white font-medium rounded-lg hover:bg-black transition disabled:opacity-50 text-sm"
                >
                  Add
                </button>
              </div>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 min-h-[100px] flex flex-wrap gap-2 items-start">
              {districts.length === 0 ? (
                <span className="text-sm text-gray-400 flex items-center gap-1 w-full justify-center mt-6">
                  <AlertCircle size={16} /> Ningún distrito agregado
                </span>
              ) : (
                districts.map(dist => (
                  <span 
                    key={dist} 
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-brand-accent/10 text-brand-accent border border-brand-accent/20"
                  >
                    {dist}
                    <button
                      type="button"
                      onClick={() => handleRemoveDistrict(dist)}
                      className="text-brand-accent hover:text-black ml-1 outline-none"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        </form>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => onClose()}
            className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2.5 bg-brand-accent text-white font-bold rounded-lg hover:bg-black transition flex items-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Check size={18} />
                {zone ? 'Guardar Cambios' : 'Crear Zona'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
