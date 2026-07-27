import React, { useEffect, useState } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';
import { useAdminCoupons } from './hooks/useAdminCoupons';
import { Ticket, Search, Plus, Loader2, X, RefreshCw, Tag } from 'lucide-react';
import { handleNumericKeyDown, handleIntegerKeyDown } from '@/shared/validation/documentValidators';

export const CouponsAdminPage: React.FC = () => {
  const { coupons, fetchCoupons, loading, createBatch, total, totalPages } = useAdminCoupons();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [page, setPage] = useState(1);
  const [isActiveFilter, setIsActiveFilter] = useState<string>('all');
  
  const [formData, setFormData] = useState({
    prefix: '',
    quantity: 10,
    type: 'PERCENT',
    value: 10,
    minPurchaseAmount: '',
    specificProductId: '',
    specificCategoryId: '',
    maxUses: '',
    expiresAt: '',
  });

  useEffect(() => {
    fetchCoupons(page, 20, isActiveFilter === 'all' ? undefined : isActiveFilter === 'true');
  }, [fetchCoupons, page, isActiveFilter]);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        prefix: formData.prefix,
        quantity: Number(formData.quantity),
        type: formData.type as 'PERCENT' | 'FIXED',
        value: Number(formData.value),
        minPurchaseAmount: formData.minPurchaseAmount ? Number(formData.minPurchaseAmount) : undefined,
        specificProductId: formData.specificProductId ? Number(formData.specificProductId) : undefined,
        specificCategoryId: formData.specificCategoryId ? Number(formData.specificCategoryId) : undefined,
        maxUses: formData.maxUses ? Number(formData.maxUses) : undefined,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined,
      };
      
      await createBatch(data);
      alert('Cupones Creados exitosamente');
      setIsModalVisible(false);
      setFormData({
        prefix: '', quantity: 10, type: 'PERCENT', value: 10,
        minPurchaseAmount: '', specificProductId: '', specificCategoryId: '',
        maxUses: '', expiresAt: ''
      });
      fetchCoupons(1, 20, isActiveFilter === 'all' ? undefined : isActiveFilter === 'true'); // refresh
    } catch (error) {
      alert('Error: No se pudieron crear los cupones.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-[#D9D9D2]/40 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-[#141513]">Gestión de Cupones</h1>
          <p className="text-gray-500 mt-1">Total registrados: {total}</p>
        </div>
        <button
          onClick={() => setIsModalVisible(true)}
          className="flex items-center gap-2 bg-[#2D2D2D] hover:bg-black text-white px-5 py-2.5 rounded-xl transition-colors font-medium shadow-sm"
        >
          <Plus size={20} />
          Generar Cupones
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#D9D9D2]/40 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#D9D9D2]/40 bg-[#FAFAFA]/50">
          <select 
            value={isActiveFilter}
            onChange={(e) => {
              setIsActiveFilter(e.target.value);
              setPage(1);
            }}
            className="w-48 px-3 py-2 bg-white border border-[#D9D9D2] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
          >
            <option value="all">Todos los estados</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAFAFA]/50 border-b border-[#D9D9D2]/40">
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Código</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo / Valor</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Uso</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Restricciones</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vence</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9D9D2]/40">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">Cargando...</td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">No hay cupones registrados.</td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-[#FAFAFA]/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-sm font-medium">{coupon.code}</td>
                    <td className="py-3 px-4">
                      {coupon.type === 'PERCENTAGE' ? `${coupon.value}%` : `S/ ${coupon.value}`}
                    </td>
                    <td className="py-3 px-4">
                      {coupon.usedCount} / {coupon.maxUses || '∞'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {coupon.minPurchaseAmount && (
                          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                            Min S/ {coupon.minPurchaseAmount}
                          </span>
                        )}
                        {coupon.specificProductId && (
                          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                            <Tag size={12}/> Prod {coupon.specificProductId}
                          </span>
                        )}
                        {coupon.specificCategoryId && (
                          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                            <Tag size={12}/> Cat {coupon.specificCategoryId}
                          </span>
                        )}
                        {!coupon.minPurchaseAmount && !coupon.specificProductId && !coupon.specificCategoryId && (
                          <span className="text-gray-400 text-sm">Ninguna</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'Nunca'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {coupon.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#D9D9D2]/40 flex justify-between items-center">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-[#D9D9D2] rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-600">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-[#D9D9D2] rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      {isModalVisible && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#D9D9D2]/40 px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-lg font-bold">Generar Cupones (Batch)</h2>
              <button 
                onClick={() => setIsModalVisible(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleCreateBatch} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prefijo *</label>
                  <input
                    required
                    type="text"
                    value={formData.prefix}
                    onChange={e => setFormData({...formData, prefix: e.target.value.toUpperCase()})}
                    placeholder="Ej. VERANO"
                    className="w-full px-3 py-2 border border-[#D9D9D2] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    max="500"
                    value={formData.quantity}
                    onKeyDown={handleIntegerKeyDown}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val < 0) return;
                      setFormData({...formData, quantity: val})
                    }}
                    className="w-full px-3 py-2 border border-[#D9D9D2] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                    className="w-full px-3 py-2 border border-[#D9D9D2] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                  >
                    <option value="PERCENT">Porcentaje (%)</option>
                    <option value="FIXED">Monto Fijo (S/.)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    max={formData.type === 'PERCENTAGE' ? 100 : undefined}
                    value={formData.value}
                    onKeyDown={handleNumericKeyDown}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val < 0) return;
                      if (formData.type === 'PERCENT' && val > 100) return;
                      setFormData({...formData, value: val})
                    }}
                    className="w-full px-3 py-2 border border-[#D9D9D2] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Compra Mínima (Opcional)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.minPurchaseAmount || ''}
                  onKeyDown={handleNumericKeyDown}
                  onChange={e => {
                    const val = e.target.value ? parseFloat(e.target.value) : undefined;
                    if (val !== undefined && val < 0) return;
                    setFormData({...formData, minPurchaseAmount: val as any})
                  }}
                  placeholder="Ej. 100"
                  className="w-full px-3 py-2 border border-[#D9D9D2] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID Producto (Opcional)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.specificProductId || ''}
                    onKeyDown={handleIntegerKeyDown}
                    onChange={e => {
                      const val = e.target.value ? parseInt(e.target.value) : undefined;
                      if (val !== undefined && val < 0) return;
                      setFormData({...formData, specificProductId: val as any})
                    }}
                    className="w-full px-3 py-2 border border-[#D9D9D2] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID Categoría (Opcional)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.specificCategoryId || ''}
                    onKeyDown={handleIntegerKeyDown}
                    onChange={e => {
                      const val = e.target.value ? parseInt(e.target.value) : undefined;
                      if (val !== undefined && val < 0) return;
                      setFormData({...formData, specificCategoryId: val as any})
                    }}
                    className="w-full px-3 py-2 border border-[#D9D9D2] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usos Máximos (Opcional)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxUses || ''}
                    onKeyDown={handleIntegerKeyDown}
                    onChange={e => {
                      const val = e.target.value ? parseInt(e.target.value) : undefined;
                      if (val !== undefined && val < 0) return;
                      setFormData({...formData, maxUses: val as any})
                    }}
                    placeholder="Por cupón"
                    className="w-full px-3 py-2 border border-[#D9D9D2] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vencimiento (Opcional)</label>
                  <input
                    type="date"
                    value={formData.expiresAt}
                    onChange={e => setFormData({...formData, expiresAt: e.target.value})}
                    className="w-full px-3 py-2 border border-[#D9D9D2] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#D9D9D2]/40 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalVisible(false)}
                  className="px-5 py-2.5 rounded-xl border border-[#D9D9D2] font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-[#2D2D2D] text-white font-medium hover:bg-black transition-colors disabled:opacity-50"
                >
                  {loading ? 'Generando...' : 'Generar Cupones'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
