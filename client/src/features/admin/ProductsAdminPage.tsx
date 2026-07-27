import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';
import { Loader2, Box, Plus, Pencil } from 'lucide-react';

interface Product {
  id: number;
  code: string;
  name: string;
  model: string | null;
  description: string | null;
  isActive: boolean;
}

export const ProductsAdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Intentamos listar productos desde la API (o mockear algunos de prueba si la BD está limpia)
      const { data } = await axiosInstance.get('/v1/products');
      setProducts(data.data || []);
    } catch (error) {
      // Fallback a productos mock para pruebas directas en local si el catálogo está vacío
      const mockProducts: Product[] = [
        { id: 1, code: 'CAM', name: 'Camisa Formal Slim Fit', model: 'Slim Fit 2026', description: 'Camisa de algodón premium', isActive: true },
        { id: 2, code: 'PAN', name: 'Pantalón Chino Elegante', model: 'Gabardina Classic', description: 'Pantalón gabardina casual', isActive: true },
      ];
      setProducts(mockProducts);
      toast('Mostrando productos de demostración local.', {
        icon: 'ℹ️',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-[#F7F7F5]/50">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#D9D9D2]/40 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-[#3F3F3F] tracking-tight">Administración de Productos</h1>
          <p className="text-sm text-[#6B6B6B] mt-1">Gestiona el inventario, catálogo y variantes de SKU únicas.</p>
        </div>
        <button
          onClick={() => navigate('/admin/products/new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#3F3F3F] text-[#FAFAFA] rounded-xl text-sm font-bold shadow hover:bg-[#3F3F3F]/95 transition-all"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>Nuevo Producto</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#D9D9D2]/30 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#3F3F3F]" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Box className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <h3 className="font-semibold text-base text-[#3F3F3F]">No hay productos registrados</h3>
            <p className="text-sm text-gray-400 mt-1">Comienza creando tu primer producto usando el botón superior.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-[#3F3F3F] uppercase tracking-wider">Código Base (SKU)</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#3F3F3F] uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#3F3F3F] uppercase tracking-wider">Modelo</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#3F3F3F] uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#3F3F3F] uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-[#6B6B6B]">
                      {p.code}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-[#3F3F3F]">
                      {p.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500">
                      {p.model || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        p.isActive 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {p.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => navigate(`/admin/products/${p.id}/edit`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 text-[#3F3F3F] hover:bg-gray-50 transition-all text-xs font-bold shadow-2xs"
                        title="Gestionar Producto y Variantes"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Gestionar</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsAdminPage;
