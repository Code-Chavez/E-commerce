import React, { useState, useEffect } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import { Camera, Check, X, Trash2, Plus, AlertCircle, Loader } from 'lucide-react';

interface SocialProof {
  id: number;
  imageUrl: string;
  clientName: string;
  isApproved: boolean;
  uploadedAt: string;
}

export const SocialProofAdminPage: React.FC = () => {
  const [proofs, setProofs] = useState<SocialProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newImage, setNewImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchProofs();
  }, []);

  const fetchProofs = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/v1/social-proof/admin');
      setProofs(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar las fotos');
    } finally {
      setLoading(false);
    }
  };

  const toggleApproval = async (id: number, currentStatus: boolean) => {
    try {
      await axiosInstance.patch(`/v1/social-proof/admin/${id}/approve`, {
        isApproved: !currentStatus
      });
      setProofs(proofs.map(p => p.id === id ? { ...p, isApproved: !currentStatus } : p));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al cambiar estado');
    }
  };

  const deleteProof = async (id: number) => {
    if (!confirm('Seguro que deseas eliminar esta foto?')) return;
    try {
      await axiosInstance.delete(`/v1/social-proof/admin/${id}`);
      setProofs(proofs.filter(p => p.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al eliminar');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newImage) {
      alert('Debes proveer un nombre y una imagen');
      return;
    }

    const formData = new FormData();
    formData.append('clientName', newClientName);
    formData.append('image', newImage);

    try {
      setIsUploading(true);
      const res = await axiosInstance.post('/v1/social-proof/admin', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProofs([res.data, ...proofs]);
      setIsModalOpen(false);
      setNewClientName('');
      setNewImage(null);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al subir imagen');
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Camera className="w-6 h-6 text-blue-600" />
            Galera de Clientes (Social Proof)
          </h1>
          <p className="text-gray-500 text-sm mt-1">Gestiona las fotos de clientes felices para mostrar en la tienda.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" /> Subir Foto
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {proofs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Camera className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No hay fotos registradas</h3>
          <p className="text-gray-500 mb-4">Comienza subiendo la primera foto de un cliente.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Subir una foto ahora
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {proofs.map((proof) => (
            <div key={proof.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="h-48 w-full bg-gray-100 relative group">
                <img src={proof.imageUrl} alt={proof.clientName} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => toggleApproval(proof.id, proof.isApproved)}
                    title={proof.isApproved ? "Ocultar de la tienda" : "Mostrar en la tienda"}
                    className={`p-1.5 rounded-full shadow-sm text-white transition ${
                      proof.isApproved ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 hover:bg-gray-500'
                    }`}
                  >
                    {proof.isApproved ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => deleteProof(proof.id)}
                    title="Eliminar permanentemente"
                    className="p-1.5 rounded-full shadow-sm bg-red-500 text-white hover:bg-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 truncate">{proof.clientName}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(proof.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="mt-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    proof.isApproved ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {proof.isApproved ? 'Visible' : 'Oculto'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Upload */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">Subir Nueva Foto</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Cliente</label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Mara Prez"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fotografa</label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={(e) => setNewImage(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {isUploading ? <Loader className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  {isUploading ? 'Subiendo...' : 'Guardar Foto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
