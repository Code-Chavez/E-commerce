import { useState, useEffect } from 'react';
import { useExpenses } from '../hooks/useExpenses';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { ExpenseSummaryCards } from './components/ExpenseSummaryCards';
import { ExpensesTable } from './components/ExpensesTable';
import { ExpenseForm } from './components/ExpenseForm';
import { Plus } from 'lucide-react';
import axiosInstance from '@/shared/api/axiosInstance';
import type { OperatingExpense } from '../types/expenses';

interface Branch {
  id: number;
  name: string;
}

export const ExpensesPage = () => {
  useDocumentTitle('Gastos Operativos | Panel de Administración');
  
  const {
    expenses,
    loading,
    submitting,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense
  } = useExpenses();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<OperatingExpense | null>(null);
  
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  useEffect(() => {
    fetchExpenses(selectedBranchId ? { branchId: parseInt(selectedBranchId, 10) } : undefined);
  }, [fetchExpenses, selectedBranchId]);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const { data } = await axiosInstance.get('/v1/branches');
        setBranches(data.data || []);
      } catch (err) {
        console.error('Error fetching branches:', err);
      }
    };
    fetchBranches();
  }, []);

  const handleCreateOrUpdate = async (data: any) => {
    let success = false;
    if (editingExpense) {
      success = await updateExpense(editingExpense.id, data);
    } else {
      success = await createExpense(data);
    }

    if (success) {
      setIsFormOpen(false);
      setEditingExpense(null);
      fetchExpenses(selectedBranchId ? { branchId: parseInt(selectedBranchId, 10) } : undefined);
    }
    return success;
  };

  const handleEdit = (expense: OperatingExpense) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este gasto operativo?')) {
      const success = await deleteExpense(id);
      if (success) {
        fetchExpenses(selectedBranchId ? { branchId: parseInt(selectedBranchId, 10) } : undefined);
      }
    }
  };

  const handleOpenForm = () => {
    setEditingExpense(null);
    setIsFormOpen(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#3F3F3F]">Gastos Operativos</h1>
          <p className="text-[#3F3F3F]/60 mt-1">Registra y administra los gastos de tus sucursales.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <select
            className="px-4 py-2 border border-[#D9D9D2] rounded-xl outline-none focus:border-[#3F3F3F] transition-colors bg-white font-medium text-[#3F3F3F]"
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
          >
            <option value="">Todas las sucursales</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <button
            onClick={handleOpenForm}
            className="flex items-center gap-2 bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 text-[#F7F7F5] px-4 py-2 rounded-xl transition-all shadow-md font-medium hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Nuevo Gasto
          </button>
        </div>
      </div>

      <ExpenseSummaryCards expenses={expenses} />

      <ExpensesTable 
        expenses={expenses}
        loading={loading}
        branches={branches}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {isFormOpen && (
        <ExpenseForm
          initialData={editingExpense}
          branches={branches}
          submitting={submitting}
          onSubmit={handleCreateOrUpdate}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingExpense(null);
          }}
        />
      )}
    </div>
  );
};

export default ExpensesPage;
