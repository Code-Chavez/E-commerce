import React from 'react';
import { DollarSign, TrendingDown, Landmark } from 'lucide-react';
import type { OperatingExpense } from '../../types/expenses';

interface ExpenseSummaryCardsProps {
  expenses: OperatingExpense[];
}

export const ExpenseSummaryCards: React.FC<ExpenseSummaryCardsProps> = ({ expenses }) => {
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const fixedExpenses = expenses.filter(e => e.type === 'FIXED').reduce((sum, exp) => sum + exp.amount, 0);
  const variableExpenses = expenses.filter(e => e.type === 'VARIABLE').reduce((sum, exp) => sum + exp.amount, 0);

  const formatCurrency = (val: number) => `$${val.toFixed(2)}`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#D9D9D2] flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-600">
          <DollarSign className="w-6 h-6" />
        </div>
        <p className="text-[#6B6B6B] font-semibold text-sm mb-1 uppercase tracking-wider">Gasto Total</p>
        <h3 className="text-3xl font-bold text-[#3F3F3F]">{formatCurrency(totalExpenses)}</h3>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#D9D9D2] flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4 text-blue-600">
          <Landmark className="w-6 h-6" />
        </div>
        <p className="text-[#6B6B6B] font-semibold text-sm mb-1 uppercase tracking-wider">Fijos</p>
        <h3 className="text-3xl font-bold text-[#3F3F3F]">{formatCurrency(fixedExpenses)}</h3>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#D9D9D2] flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-4 text-orange-600">
          <TrendingDown className="w-6 h-6" />
        </div>
        <p className="text-[#6B6B6B] font-semibold text-sm mb-1 uppercase tracking-wider">Variables</p>
        <h3 className="text-3xl font-bold text-[#3F3F3F]">{formatCurrency(variableExpenses)}</h3>
      </div>
    </div>
  );
};
