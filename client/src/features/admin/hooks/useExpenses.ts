import { useState, useCallback } from 'react';
import { expensesService } from '../services/expenses.service';
import type {
  OperatingExpense,
  CreateOperatingExpenseDTO,
  UpdateOperatingExpenseDTO,
  ExpenseFilters,
} from '../types/expenses';
import toast from 'react-hot-toast';

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<OperatingExpense[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchExpenses = useCallback(async (filters?: ExpenseFilters) => {
    setLoading(true);
    try {
      const { data } = await expensesService.getExpenses(filters);
      setExpenses(data);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Error al cargar los gastos operativos';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const createExpense = async (data: CreateOperatingExpenseDTO): Promise<boolean> => {
    setSubmitting(true);
    try {
      await expensesService.createExpense(data);
      toast.success('Gasto creado exitosamente');
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Error al crear el gasto';
      toast.error(msg);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const updateExpense = async (id: number, data: UpdateOperatingExpenseDTO): Promise<boolean> => {
    setSubmitting(true);
    try {
      await expensesService.updateExpense(id, data);
      toast.success('Gasto actualizado exitosamente');
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Error al actualizar el gasto';
      toast.error(msg);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const deleteExpense = async (id: number): Promise<boolean> => {
    setSubmitting(true);
    try {
      await expensesService.deleteExpense(id);
      toast.success('Gasto eliminado exitosamente');
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Error al eliminar el gasto';
      toast.error(msg);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    expenses,
    loading,
    submitting,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
  };
};
