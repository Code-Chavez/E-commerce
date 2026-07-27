import axiosInstance from '@/shared/api/axiosInstance';
import type {
  OperatingExpense,
  CreateOperatingExpenseDTO,
  UpdateOperatingExpenseDTO,
  ExpenseFilters,
} from '../types/expenses';

export interface GetExpensesResponse {
  success: boolean;
  data: OperatingExpense[];
}

export interface ExpenseResponse {
  success: boolean;
  data: OperatingExpense;
}

export const expensesService = {
  getExpenses: async (filters?: ExpenseFilters): Promise<GetExpensesResponse> => {
    const queryParams = new URLSearchParams();
    if (filters?.branchId) {
      queryParams.append('branchId', filters.branchId.toString());
    }
    if (filters?.from) {
      queryParams.append('from', filters.from);
    }
    if (filters?.to) {
      queryParams.append('to', filters.to);
    }

    const { data } = await axiosInstance.get<GetExpensesResponse>(`/v1/admin/expenses?${queryParams.toString()}`);
    return data;
  },

  createExpense: async (expenseData: CreateOperatingExpenseDTO): Promise<ExpenseResponse> => {
    const { data } = await axiosInstance.post<ExpenseResponse>('/v1/admin/expenses', expenseData);
    return data;
  },

  updateExpense: async (id: number, expenseData: UpdateOperatingExpenseDTO): Promise<ExpenseResponse> => {
    const { data } = await axiosInstance.put<ExpenseResponse>(`/v1/admin/expenses/${id}`, expenseData);
    return data;
  },

  deleteExpense: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/v1/admin/expenses/${id}`);
  },
};
