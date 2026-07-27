import React, { useState } from 'react';
import { Banknote, CreditCard, Send, Plus, Trash2, CheckCircle2, DollarSign, Search } from 'lucide-react';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';
import { handleNumericKeyDown } from '@/shared/validation/documentValidators';
import type { PaymentMethod, ReceiptType } from '../types/pos.types';

export interface PaymentItem {
  id: string;
  method: PaymentMethod;
  amount: number;
  code?: string;
}

interface PaymentPanelProps {
  totalAmount: number;
  onConfirm: (payments: PaymentItem[], receiptType: ReceiptType) => void;
  isLoading?: boolean;
}

export const PaymentPanel: React.FC<PaymentPanelProps> = ({ totalAmount, onConfirm, isLoading = false }) => {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [currentMethod, setCurrentMethod] = useState<PaymentMethod>('CASH');
  const [receiptType, setReceiptType] = useState<ReceiptType>('TICKET');
  const [currentAmount, setCurrentAmount] = useState<string>('');
  const [currentCode, setCurrentCode] = useState<string>('');
  const [isValidatingCreditNote, setIsValidatingCreditNote] = useState(false);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalPaidNonCash = payments.filter(p => p.method !== 'CASH').reduce((sum, p) => sum + p.amount, 0);
  const totalPaidCash = payments.filter(p => p.method === 'CASH').reduce((sum, p) => sum + p.amount, 0);
  
  const remaining = Math.max(0, totalAmount - totalPaid);
  // El vuelto solo se calcula sobre el efectivo, restando lo que faltaba pagar (total - otrosPagos)
  const change = Math.max(0, totalPaidCash - (totalAmount - totalPaidNonCash));

  const canConfirm = totalPaid >= totalAmount && totalAmount > 0;

  const handleAddPayment = () => {
    const amountVal = parseFloat(currentAmount);
    if (isNaN(amountVal) || amountVal <= 0) return;

    if (currentMethod === 'CREDIT_NOTE') {
      alert('Debe usar el botón de validar para agregar un vale de crédito.');
      return;
    }

    // Si es exacto o se pasa, dejarlo agregar.
    // Solo permitimos pasarnos si es efectivo (CASH)
    if (amountVal > remaining && currentMethod !== 'CASH') {
      alert(`No puedes cobrar más del restante (S/. ${remaining.toFixed(2)}) con ${currentMethod}. Solo efectivo (CASH) permite vuelto.`);
      return;
    }

    setPayments([
      ...payments,
      { id: Date.now().toString(), method: currentMethod, amount: amountVal },
    ]);
    setCurrentAmount('');
    setCurrentCode('');
  };

  const handleRemovePayment = (id: string) => {
    setPayments(payments.filter(p => p.id !== id));
  };

  const handleValidateCreditNote = async () => {
    if (!currentCode.trim()) {
      toast.error('Debe ingresar el código del vale de crédito.');
      return;
    }

    setIsValidatingCreditNote(true);
    try {
      const { data } = await axiosInstance.get(`/v1/pos/credit-notes/validate/${currentCode.trim()}`);
      
      if (data.success) {
        const creditNoteAmount = data.data.amount;
        
        if (creditNoteAmount > remaining) {
          toast.error(`El vale (S/. ${creditNoteAmount.toFixed(2)}) supera el saldo restante (S/. ${remaining.toFixed(2)}).`);
          return;
        }

        setPayments([
          ...payments,
          { id: Date.now().toString(), method: 'CREDIT_NOTE', amount: creditNoteAmount, code: data.data.code },
        ]);
        setCurrentCode('');
        toast.success(`Vale aplicado exitosamente por S/. ${creditNoteAmount.toFixed(2)}`);
      }
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.error || 'Error al validar el vale de crédito';
      toast.error(msg);
    } finally {
      setIsValidatingCreditNote(false);
    }
  };

  const methodOptions: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
    { value: 'CASH', label: 'Efectivo', icon: <Banknote size={16} /> },
    { value: 'CARD', label: 'Tarjeta', icon: <CreditCard size={16} /> },
    { value: 'YAPE', label: 'Yape / Plin', icon: <Send size={16} /> },
    { value: 'TRANSFER', label: 'Transferencia', icon: <Send size={16} /> },
    { value: 'CREDIT_NOTE', label: 'Vale de Crédito', icon: <Banknote size={16} /> },
  ];

  return (
    <div className="bg-white border-2 border-[#D9D9D2] rounded-2xl overflow-hidden shadow-sm">
      <div className="bg-[#F7F7F5] border-b border-[#D9D9D2] p-4 flex justify-between items-center">
        <h3 className="font-extrabold text-[#3F3F3F] flex items-center gap-2 uppercase tracking-wide text-sm">
          <DollarSign size={18} />
          Métodos de Pago
        </h3>
        <span className="text-[#9B9B94] font-semibold text-xs bg-white px-2 py-1 rounded-lg border border-[#D9D9D2]">
          Total: S/. {totalAmount.toFixed(2)}
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Tipo de Comprobante */}
        <div className="flex flex-col gap-3 pb-4 border-b border-[#EBEBE8]">
          <h4 className="text-xs font-bold text-[#9B9B94] uppercase tracking-wider">Tipo de Comprobante</h4>
          <div className="grid grid-cols-3 gap-2">
            {(['TICKET', 'BOLETA', 'FACTURA'] as ReceiptType[]).map((type) => (
              <button
                key={type}
                onClick={() => setReceiptType(type)}
                className={`p-2 rounded-xl border-2 transition-all font-semibold text-sm ${
                  receiptType === type
                    ? 'border-[#3F3F3F] bg-[#3F3F3F] text-white'
                    : 'border-[#EBEBE8] bg-[#F7F7F5] text-[#6B6B6B] hover:border-[#D9D9D2]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Añadir Pago */}
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            {methodOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setCurrentMethod(opt.value)}
                className={`flex items-center justify-center gap-2 p-2 rounded-xl border-2 transition-all font-semibold text-sm ${
                  currentMethod === opt.value
                    ? 'border-[#3F3F3F] bg-[#3F3F3F] text-white'
                    : 'border-[#EBEBE8] bg-[#F7F7F5] text-[#6B6B6B] hover:border-[#D9D9D2]'
                }`}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            {currentMethod === 'CREDIT_NOTE' ? (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Código del Vale de Crédito"
                    value={currentCode}
                    onChange={(e) => setCurrentCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleValidateCreditNote();
                    }}
                    className="w-full px-3 py-2 border-2 border-[#EBEBE8] rounded-xl focus:outline-none focus:border-[#3F3F3F] font-bold text-[#3F3F3F] text-sm uppercase"
                  />
                </div>
                <button
                  onClick={handleValidateCreditNote}
                  disabled={!currentCode.trim() || isValidatingCreditNote || remaining <= 0}
                  className="px-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isValidatingCreditNote ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  ) : (
                    <Search size={18} />
                  )}
                  Validar
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9B94] font-bold">S/.</span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder={remaining > 0 ? remaining.toFixed(2) : "0.00"}
                    value={currentAmount}
                    onKeyDown={(e) => {
                      handleNumericKeyDown(e);
                      if (e.key === 'Enter') handleAddPayment();
                    }}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val < 0) return;
                      setCurrentAmount(e.target.value);
                    }}
                    disabled={remaining <= 0}
                    className="w-full pl-9 pr-3 py-2 border-2 border-[#EBEBE8] rounded-xl focus:outline-none focus:border-[#3F3F3F] font-bold text-[#3F3F3F]"
                  />
                </div>
                <button
                  onClick={handleAddPayment}
                  disabled={!currentAmount || isNaN(parseFloat(currentAmount)) || parseFloat(currentAmount) <= 0 || remaining <= 0}
                  className="px-4 bg-[#3F3F3F] text-white rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Plus size={18} />
                  Añadir
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Lista de Pagos */}
        {payments.length > 0 && (
          <div className="space-y-2 border-t border-[#EBEBE8] pt-4">
            <h4 className="text-xs font-bold text-[#9B9B94] uppercase tracking-wider">Pagos Recibidos</h4>
            <div className="space-y-2">
              {payments.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-[#F7F7F5] rounded-xl border border-[#EBEBE8]">
                  <div className="flex items-center gap-3">
                    <span className="p-2 bg-white rounded-lg shadow-sm">
                      {methodOptions.find(m => m.value === p.method)?.icon}
                    </span>
                    <div>
                      <span className="block text-sm font-bold text-[#3F3F3F]">
                        {methodOptions.find(m => m.value === p.method)?.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-[#3F3F3F]">S/. {p.amount.toFixed(2)}</span>
                    <button
                      onClick={() => handleRemovePayment(p.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resumen */}
        <div className="bg-[#F7F7F5] rounded-xl p-4 border border-[#EBEBE8] space-y-2 text-sm">
          <div className="flex justify-between text-[#6B6B6B]">
            <span className="font-semibold">Total a Pagar:</span>
            <span className="font-bold text-[#3F3F3F]">S/. {totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[#6B6B6B]">
            <span className="font-semibold">Pagado:</span>
            <span className="font-bold text-[#3F3F3F]">S/. {totalPaid.toFixed(2)}</span>
          </div>
          <div className="pt-2 border-t border-[#EBEBE8] flex justify-between items-center">
            {change > 0 ? (
              <>
                <span className="font-bold text-[#c0392b] uppercase text-xs">Vuelto</span>
                <span className="font-extrabold text-[#c0392b] text-lg">S/. {change.toFixed(2)}</span>
              </>
            ) : (
              <>
                <span className="font-bold text-[#E58A1F] uppercase text-xs">Restante</span>
                <span className="font-extrabold text-[#E58A1F] text-lg">S/. {remaining.toFixed(2)}</span>
              </>
            )}
          </div>
        </div>

        {/* Botón Confirmar */}
        <button
          onClick={() => onConfirm(payments, receiptType)}
          disabled={!canConfirm || isLoading}
          className="w-full py-3.5 bg-black text-white rounded-xl font-extrabold tracking-wide uppercase text-sm flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors disabled:opacity-50 shadow-[0_4px_14px_0_rgba(0,0,0,0.39)] disabled:shadow-none mt-2"
        >
          {isLoading ? (
            <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
          ) : (
            <>
              <CheckCircle2 size={18} />
              Confirmar Venta
            </>
          )}
        </button>
      </div>
    </div>
  );
};
