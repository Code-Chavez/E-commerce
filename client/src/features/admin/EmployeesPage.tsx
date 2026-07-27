import React, { useEffect, useState } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';
import { 
  Search, 
  Loader2, 
  Edit2, 
  CheckCircle, 
  XCircle,
  Plus,
  Building2,
  Key,
  Mail,
  Users,
  UserPlus,
  Shield
} from 'lucide-react';

import { handleIntegerKeyDown } from '@/shared/validation/documentValidators';

interface Employee {
  id: number;
  name: string;
  dni: string;
  isActive: boolean;
  branchId: number;
  userId?: number | null;
  createdAt: string;
}

interface Branch {
  id: number;
  name: string;
}

interface Role {
  id: number;
  name: string;
}

export const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    dni: '',
    branchId: '',
    roleId: '',
    email: '',
    password: '',
    createAccount: false
  });

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password: pass }));
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/v1/employees', {
        params: { page, limit: 10, search: searchTerm }
      });
      setEmployees(data.data.items);
      setTotal(data.data.total);
    } catch (error) {
      toast.error('Error al cargar empleados');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const { data } = await axiosInstance.get('/v1/branches');
      setBranches(data.data);
    } catch {
      // silently ignore branch fetch errors
    }
  };

  const fetchRoles = async () => {
    try {
      const { data } = await axiosInstance.get('/v1/roles');
      setRoles(data.data);
    } catch {
      // silently ignore role fetch errors
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchBranches();
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm]);

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await axiosInstance.patch(`/v1/employees/${id}/status`, { isActive: !currentStatus });
      toast.success('Estado actualizado');
      fetchEmployees();
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingEmployee) {
        await axiosInstance.put(`/v1/employees/${editingEmployee.id}`, {
          name: formData.name,
          branchId: parseInt(formData.branchId),
          roleId: formData.roleId ? parseInt(formData.roleId) : null
        });
        toast.success('Empleado actualizado');
      } else {
        const payload: any = {
          name: formData.name,
          dni: formData.dni,
          branchId: parseInt(formData.branchId),
          roleId: formData.roleId ? parseInt(formData.roleId) : null
        };
        if (formData.createAccount) {
          payload.email = formData.email;
          payload.password = formData.password;
        }
        await axiosInstance.post('/v1/employees', payload);
        toast.success('Empleado creado exitosamente');
      }
      setIsModalOpen(false);
      setEditingEmployee(null);
      setFormData({ name: '', dni: '', branchId: '', roleId: '', email: '', password: '', createAccount: false });
      fetchEmployees();
    } catch (error: any) {
      const errorData = error.response?.data?.error;
      const errorMessage = Array.isArray(errorData) 
        ? errorData[0]?.message || 'Error de validación'
        : errorData || 'Error al procesar solicitud';
      toast.error(typeof errorMessage === 'string' ? errorMessage : 'Error desconocido');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      dni: employee.dni,
      branchId: employee.branchId.toString(),
      roleId: '',
      email: '',
      password: '',
      createAccount: false
    });
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#3F3F3F]">Gestión de Empleados</h1>
          <p className="text-[#3F3F3F]/60 mt-1">Administra el personal de tus sucursales y sus permisos.</p>
        </div>
        
        <button
          onClick={() => {
            setEditingEmployee(null);
            setFormData({ name: '', dni: '', branchId: '', roleId: '', email: '', password: '', createAccount: false });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 text-[#F7F7F5] px-4 py-2 rounded-xl transition-all shadow-md font-medium hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Nuevo Empleado
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#D9D9D2] overflow-hidden">
        <div className="p-4 border-b border-[#D9D9D2]/40 bg-[#FAFAFA] flex items-center gap-3">
          <Search className="w-5 h-5 text-[#6B6B6B]" />
          <input
            type="text"
            placeholder="Buscar por nombre o DNI..."
            className="bg-transparent border-none focus:ring-0 w-full text-[#3F3F3F] outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAFAFA] text-[#3F3F3F] uppercase text-xs font-bold tracking-wider border-b border-[#D9D9D2]/40">
                <th className="px-6 py-4">Empleado</th>
                <th className="px-6 py-4">DNI</th>
                <th className="px-6 py-4">Sucursal</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9D9D2]/40">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#3F3F3F]" />
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#6B6B6B]">
                    No se encontraron empleados.
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#3F3F3F]">{employee.name}</div>
                      <div className="text-xs text-[#6B6B6B] font-semibold">ID: {employee.id}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-[#3F3F3F]">
                      {employee.dni}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-[#3F3F3F]">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#6B6B6B]" />
                        {branches.find(b => b.id === employee.branchId)?.name || 'Cargando...'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(employee.id, employee.isActive)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          employee.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {employee.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {employee.isActive ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => openEditModal(employee)}
                        className="text-[#6B6B6B] hover:text-[#3F3F3F] transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 10 && (
          <div className="px-6 py-4 bg-[#FAFAFA] border-t border-[#D9D9D2]/40 flex items-center justify-between">
            <span className="text-sm font-semibold text-[#6B6B6B]">
              Mostrando {(page - 1) * 10 + 1} - {Math.min(page * 10, total)} de {total} empleados
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 border border-[#D9D9D2] rounded-lg hover:bg-[#FAFAFA] disabled:opacity-50 text-[#3F3F3F] font-bold text-xs"
              >
                Anterior
              </button>
              <button
                disabled={page * 10 >= total}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 border border-[#D9D9D2] rounded-lg hover:bg-[#FAFAFA] disabled:opacity-50 text-[#3F3F3F] font-bold text-xs"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-[#D9D9D2]/40">
              <h2 className="text-xl font-bold text-[#3F3F3F]">
                {editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-[#3F3F3F]">Nombre Completo</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-[#D9D9D2] rounded-xl outline-none focus:border-[#3F3F3F] transition-colors"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {!editingEmployee && (
                <div className="space-y-1">
                  <label className="text-sm font-bold text-[#3F3F3F]">DNI</label>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    maxLength={8}
                    onKeyDown={handleIntegerKeyDown}
                    className="w-full px-4 py-2 border border-[#D9D9D2] rounded-xl outline-none focus:border-[#3F3F3F] transition-colors"
                    value={formData.dni}
                    onChange={e => setFormData({ ...formData, dni: e.target.value })}
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-bold text-[#3F3F3F]">Sucursal</label>
                <select
                  required
                  className="w-full px-4 py-2 border border-[#D9D9D2] rounded-xl outline-none focus:border-[#3F3F3F] transition-colors bg-white"
                  value={formData.branchId}
                  onChange={e => setFormData({ ...formData, branchId: e.target.value })}
                >
                  <option value="">Selecciona sucursal</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>

              {!editingEmployee && (
                <div className="pt-4 border-t border-[#D9D9D2]/40">
                  <label className="flex items-center gap-2 cursor-pointer mb-4">
                    <input
                      type="checkbox"
                      checked={formData.createAccount}
                      onChange={e => setFormData({ ...formData, createAccount: e.target.checked })}
                      className="w-4 h-4 rounded border-[#D9D9D2] text-[#3F3F3F] focus:ring-[#3F3F3F]"
                    />
                    <span className="text-sm font-bold text-[#3F3F3F]">Crear cuenta de acceso al sistema</span>
                  </label>

                  {formData.createAccount && (
                    <div className="space-y-4 p-4 bg-[#FAFAFA] rounded-xl border border-[#D9D9D2]/40">
                      <div className="space-y-1">
                        <label className="text-sm font-bold text-[#3F3F3F]">Correo Electrónico</label>
                        <div className="relative">
                          <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B6B]" />
                          <input
                            type="email"
                            required={formData.createAccount}
                            className="w-full pl-10 pr-4 py-2 border border-[#D9D9D2] rounded-xl outline-none focus:border-[#3F3F3F] transition-colors"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-bold text-[#3F3F3F]">Contraseña</label>
                          <button
                            type="button"
                            onClick={generatePassword}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800"
                          >
                            Generar aleatoria
                          </button>
                        </div>
                        <div className="relative">
                          <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B6B]" />
                          <input
                            type="text"
                            required={formData.createAccount}
                            className="w-full pl-10 pr-4 py-2 border border-[#D9D9D2] rounded-xl outline-none focus:border-[#3F3F3F] transition-colors font-mono"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(formData.createAccount || (editingEmployee && editingEmployee.userId)) && (
                <div className="space-y-1">
                  <label className="text-sm font-bold text-[#3F3F3F]">Rol asignado (opcional)</label>
                  <select
                    className="w-full px-4 py-2 border border-[#D9D9D2] rounded-xl outline-none focus:border-[#3F3F3F] transition-colors bg-white"
                    value={formData.roleId}
                    onChange={e => setFormData({ ...formData, roleId: e.target.value })}
                  >
                    <option value="">Sin rol asignado</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {editingEmployee && !editingEmployee.userId && (
                <div className="p-3 bg-[#FAFAFA] border border-[#D9D9D2]/40 rounded-xl">
                  <p className="text-xs text-[#6B6B6B]">
                    ⚠️ No se puede asignar un rol administrativo porque el empleado no tiene una cuenta de usuario vinculada en el sistema.
                  </p>
                </div>
              )}

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 text-[#3F3F3F] font-bold hover:bg-[#FAFAFA] rounded-xl transition-colors border border-[#D9D9D2]/40"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 text-[#F7F7F5] font-bold py-2 rounded-xl transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingEmployee ? 'Actualizar' : 'Crear Empleado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesPage;
