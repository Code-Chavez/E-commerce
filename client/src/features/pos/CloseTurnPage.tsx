import React, { useEffect, useState, useCallback } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import { usePos } from '@/features/pos/context/PosContext';
import { useNavigate } from 'react-router-dom';
import { ConfirmModal } from '@/features/admin/components/ConfirmModal';
import { toast } from 'react-hot-toast';
import { handleNumericKeyDown } from '@/shared/validation/documentValidators';
import {
  Loader2,
  RefreshCw,
  AlertTriangle,
  Clock,
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  CreditCard,
  Landmark,
  Smartphone,
  Plus,
  X,
  Lock,
  Calculator,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from 'lucide-react';

/* ─── Interfaces ─────────────────────────────────────────────────── */

interface CashMovement {
  id: number;
  turnId: number;
  type: 'INGRESO' | 'EGRESO';
  amount: number;
  reason: string;
  createdAt: string;
}

interface SaleListItem {
  id: number;
  status: string;
  total: string | number;
  createdAt: string;
  payments: { method: string; amount: string | number }[];
}

interface CloseSummary {
  turnId: number;
  openAmount: number;
  closeAmount: number;
  totalIngresos: number;
  totalEgresos: number;
  totalVentas: number;
  salesCount: number;
  expectedAmount: number;
  difference: number;
  status: string;
  closedAt: string;
}

/* ─── Component ──────────────────────────────────────────────────── */

export const CloseTurnPage: React.FC = () => {
  const { turnId, isOpen, closeShiftLocal } = usePos();
  const navigate = useNavigate();

  // Data
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [sales, setSales] = useState<SaleListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Movement form
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [movType, setMovType] = useState<'INGRESO' | 'EGRESO'>('INGRESO');
  const [movAmount, setMovAmount] = useState('');
  const [movReason, setMovReason] = useState('');
  const [submittingMov, setSubmittingMov] = useState(false);

  // Close turn
  const [closeAmount, setCloseAmount] = useState('');
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closingTurn, setClosingTurn] = useState(false);
  const [closeSummary, setCloseSummary] = useState<CloseSummary | null>(null);

  // Active turn data (fetched from backend)
  const [turnData, setTurnData] = useState<{ openAmount: number; openedAt: string } | null>(null);

  /* ── Fetch ────────────────────────────────────────────────────── */

  const fetchAll = useCallback(async () => {
    if (!turnId) return;
    setLoading(true);
    try {
      const [movRes, salesRes, turnRes] = await Promise.all([
        axiosInstance.get(`/v1/cash-turns/${turnId}/movements`),
        axiosInstance.get(`/v1/pos/turns/${turnId}/sales`),
        axiosInstance.get('/v1/cash-turns/active'),
      ]);
      if (movRes.data.success) setMovements(movRes.data.data);
      if (salesRes.data.success) setSales(salesRes.data.data);
      if (turnRes.data.success) setTurnData(turnRes.data.data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      toast.error(axiosErr.response?.data?.error || 'Error al cargar datos del turno');
    } finally {
      setLoading(false);
    }
  }, [turnId]);

  useEffect(() => {
    if (isOpen && turnId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchAll();
    }
  }, [isOpen, turnId, fetchAll]);

  /* ── Computed values (real-time) ──────────────────────────────── */

  const totalIngresos = movements
    .filter((m) => m.type === 'INGRESO')
    .reduce((sum, m) => sum + m.amount, 0);

  const totalEgresos = movements
    .filter((m) => m.type === 'EGRESO')
    .reduce((sum, m) => sum + m.amount, 0);

  const totalVentas = sales
    .filter((s) => s.status === 'COMPLETED')
    .reduce((sum, s) => sum + Number(s.total), 0);

  const salesCount = sales.filter((s) => s.status === 'COMPLETED').length;

  const openAmount = turnData?.openAmount ?? 0;

  const expectedAmount = openAmount + totalIngresos - totalEgresos + totalVentas;

  const difference = closeAmount ? parseFloat(closeAmount) - expectedAmount : 0;

  /* ── Payment method breakdown ────────────────────────────────── */

  const paymentBreakdown = sales
    .filter((s) => s.status === 'COMPLETED')
    .flatMap((s) => s.payments)
    .reduce<Record<string, number>>((acc, p) => {
      acc[p.method] = (acc[p.method] || 0) + Number(p.amount);
      return acc;
    }, {});

  /* ── Register movement ───────────────────────────────────────── */

  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnId || !movAmount || !movReason.trim()) return;

    const amount = parseFloat(movAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('El monto debe ser un número positivo');
      return;
    }
    if (movReason.trim().length < 3) {
      toast.error('El motivo debe tener al menos 3 caracteres');
      return;
    }

    setSubmittingMov(true);
    try {
      await axiosInstance.post(`/v1/cash-turns/${turnId}/movements`, {
        type: movType,
        amount,
        reason: movReason.trim(),
      });
      toast.success(`${movType === 'INGRESO' ? 'Ingreso' : 'Egreso'} registrado`);
      setMovAmount('');
      setMovReason('');
      setShowMovementForm(false);
      await fetchAll();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      toast.error(axiosErr.response?.data?.error || 'Error al registrar movimiento');
    } finally {
      setSubmittingMov(false);
    }
  };

  /* ── Close turn ──────────────────────────────────────────────── */

  const handleCloseTurn = async () => {
    if (!turnId) return;
    setClosingTurn(true);
    try {
      const payload: Record<string, number> = {};
      if (closeAmount) payload.closeAmount = parseFloat(closeAmount);

      const { data } = await axiosInstance.post(`/v1/cash-turns/${turnId}/close`, payload);
      if (data.success) {
        setCloseSummary(data.data);
        setShowCloseModal(false);
        toast.success('Turno cerrado exitosamente');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      toast.error(axiosErr.response?.data?.error || 'Error al cerrar el turno');
      setShowCloseModal(false);
    } finally {
      setClosingTurn(false);
    }
  };

  const handleFinish = () => {
    closeShiftLocal();
    navigate('/pos/open-cash');
  };

  /* ── Payment icon helper ─────────────────────────────────────── */

  const getMethodLabel = (method: string) => {
    const map: Record<string, { icon: React.ReactNode; label: string }> = {
      CASH: { icon: <Banknote className="w-4 h-4 text-green-600" />, label: 'Efectivo' },
      CARD: { icon: <CreditCard className="w-4 h-4 text-blue-600" />, label: 'Tarjeta' },
      TRANSFER: { icon: <Landmark className="w-4 h-4 text-indigo-600" />, label: 'Transferencia' },
      YAPE: { icon: <Smartphone className="w-4 h-4 text-purple-600" />, label: 'Yape' },
    };
    return map[method] || { icon: <Banknote className="w-4 h-4" />, label: method };
  };

  /* ── Guard: no open turn ─────────────────────────────────────── */

  if (!isOpen) {
    return (
      <div className="p-6">
        <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <p className="text-sm font-semibold">Debes abrir un turno de caja para acceder al cierre.</p>
        </div>
      </div>
    );
  }

  /* ── Closed summary view ─────────────────────────────────────── */

  if (closeSummary) {
    const s = closeSummary;
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-emerald-700" />
          </div>
          <h1 className="text-2xl font-black text-[#3F3F3F]">Turno Cerrado</h1>
          <p className="text-sm text-[#6B6B6B] mt-1">Resumen del cierre de caja</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#D9D9D2]/40 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-[#FAFAFA] rounded-xl p-4">
              <p className="text-[#6B6B6B] text-xs font-semibold mb-1">Monto Inicial</p>
              <p className="text-lg font-black text-[#3F3F3F]">S/ {s.openAmount.toFixed(2)}</p>
            </div>
            <div className="bg-[#FAFAFA] rounded-xl p-4">
              <p className="text-[#6B6B6B] text-xs font-semibold mb-1">Ventas ({s.salesCount})</p>
              <p className="text-lg font-black text-emerald-700">+ S/ {s.totalVentas.toFixed(2)}</p>
            </div>
            <div className="bg-[#FAFAFA] rounded-xl p-4">
              <p className="text-[#6B6B6B] text-xs font-semibold mb-1">Ingresos Manuales</p>
              <p className="text-lg font-black text-blue-700">+ S/ {s.totalIngresos.toFixed(2)}</p>
            </div>
            <div className="bg-[#FAFAFA] rounded-xl p-4">
              <p className="text-[#6B6B6B] text-xs font-semibold mb-1">Egresos Manuales</p>
              <p className="text-lg font-black text-red-600">- S/ {s.totalEgresos.toFixed(2)}</p>
            </div>
          </div>

          <div className="border-t border-[#D9D9D2]/40 pt-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-[#6B6B6B]">Monto Esperado</span>
              <span className="text-lg font-black text-[#3F3F3F]">S/ {s.expectedAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-[#6B6B6B]">Monto Declarado</span>
              <span className="text-lg font-black text-[#3F3F3F]">S/ {s.closeAmount.toFixed(2)}</span>
            </div>
            <div className={`flex justify-between items-center p-3 rounded-xl ${
              s.difference === 0 ? 'bg-emerald-50' :
              s.difference > 0 ? 'bg-blue-50' : 'bg-red-50'
            }`}>
              <span className="text-sm font-bold text-[#3F3F3F]">Diferencia</span>
              <span className={`text-lg font-black ${
                s.difference === 0 ? 'text-emerald-700' :
                s.difference > 0 ? 'text-blue-700' : 'text-red-600'
              }`}>
                {s.difference >= 0 ? '+' : ''} S/ {s.difference.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleFinish}
          className="w-full bg-[#3F3F3F] hover:bg-black text-white font-bold py-3 rounded-xl transition-all shadow-sm text-sm"
        >
          Finalizar
        </button>
      </div>
    );
  }

  /* ── Main view ───────────────────────────────────────────────── */

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#3F3F3F]">Cierre de Turno</h1>
          <p className="text-sm text-[#6B6B6B] mt-1 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Turno #{turnId} — Inicio: {turnData
              ? new Date(turnData.openedAt).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
              : '...'}
          </p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#D9D9D2] hover:bg-[#FAFAFA] text-[#3F3F3F] text-sm font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {loading && !movements.length && !sales.length ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#6B6B6B]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left Column: Movements + Sales ───────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Movements Panel */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#D9D9D2]/40">
              <div className="px-6 py-4 border-b border-[#D9D9D2]/40 flex items-center justify-between">
                <h2 className="text-base font-black text-[#3F3F3F] flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Movimientos de Caja
                </h2>
                <button
                  onClick={() => setShowMovementForm(!showMovementForm)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3F3F3F] hover:bg-black text-white text-xs font-bold rounded-lg transition-all shadow-sm"
                >
                  {showMovementForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  {showMovementForm ? 'Cancelar' : 'Agregar'}
                </button>
              </div>

              {/* Movement form */}
              {showMovementForm && (
                <form onSubmit={handleAddMovement} className="px-6 py-4 bg-[#FAFAFA] border-b border-[#D9D9D2]/40 space-y-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setMovType('INGRESO')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                        movType === 'INGRESO'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white border border-[#D9D9D2] text-[#6B6B6B] hover:bg-blue-50'
                      }`}
                    >
                      <ArrowDownCircle className="w-4 h-4 inline mr-1" />
                      Ingreso
                    </button>
                    <button
                      type="button"
                      onClick={() => setMovType('EGRESO')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                        movType === 'EGRESO'
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'bg-white border border-[#D9D9D2] text-[#6B6B6B] hover:bg-red-50'
                      }`}
                    >
                      <ArrowUpCircle className="w-4 h-4 inline mr-1" />
                      Egreso
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Monto (S/)"
                    value={movAmount}
                    onChange={(e) => setMovAmount(e.target.value)}
                    className="w-full border border-[#D9D9D2] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#3F3F3F]/20"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Motivo del movimiento"
                    value={movReason}
                    onChange={(e) => setMovReason(e.target.value)}
                    className="w-full border border-[#D9D9D2] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#3F3F3F]/20"
                    required
                    minLength={3}
                  />
                  <button
                    type="submit"
                    disabled={submittingMov}
                    className="w-full bg-[#3F3F3F] hover:bg-black text-white font-bold py-2.5 rounded-lg text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submittingMov && <Loader2 className="w-4 h-4 animate-spin" />}
                    Registrar {movType === 'INGRESO' ? 'Ingreso' : 'Egreso'}
                  </button>
                </form>
              )}

              {/* Movements list */}
              <div className="max-h-64 overflow-y-auto">
                {movements.length === 0 ? (
                  <div className="p-8 text-center text-[#6B6B6B]">
                    <p className="text-sm">No hay movimientos registrados</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#D9D9D2]/20">
                    {movements.map((m) => (
                      <div key={m.id} className="px-6 py-3 flex items-center justify-between hover:bg-[#FAFAFA]/50">
                        <div className="flex items-center gap-3">
                          {m.type === 'INGRESO' ? (
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <TrendingUp className="w-4 h-4 text-blue-600" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                              <TrendingDown className="w-4 h-4 text-red-600" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-bold text-[#3F3F3F]">{m.reason}</p>
                            <p className="text-xs text-[#6B6B6B]">
                              {new Date(m.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <span className={`text-sm font-black ${m.type === 'INGRESO' ? 'text-blue-700' : 'text-red-600'}`}>
                          {m.type === 'INGRESO' ? '+' : '-'} S/ {m.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sales Summary Panel */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#D9D9D2]/40">
              <div className="px-6 py-4 border-b border-[#D9D9D2]/40">
                <h2 className="text-base font-black text-[#3F3F3F] flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Ventas del Turno
                  <span className="text-xs font-semibold text-[#6B6B6B] bg-[#FAFAFA] px-2 py-0.5 rounded-full">
                    {salesCount}
                  </span>
                </h2>
              </div>

              {/* Payment method breakdown */}
              {salesCount > 0 && (
                <div className="px-6 py-3 border-b border-[#D9D9D2]/20 bg-[#FAFAFA]">
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(paymentBreakdown).map(([method, amount]) => {
                      const { icon, label } = getMethodLabel(method);
                      return (
                        <div
                          key={method}
                          className="flex items-center gap-2 px-3 py-2 bg-white border border-[#D9D9D2]/50 rounded-xl"
                        >
                          {icon}
                          <span className="text-xs font-bold text-[#3F3F3F]">{label}</span>
                          <span className="text-xs font-black text-[#3F3F3F]">S/ {amount.toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sales table (compact) */}
              <div className="max-h-48 overflow-y-auto">
                {salesCount === 0 ? (
                  <div className="p-8 text-center text-[#6B6B6B]">
                    <p className="text-sm">No hay ventas en este turno</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#FAFAFA] text-[#6B6B6B] border-b border-[#D9D9D2]/40 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 font-bold text-xs">N° Pedido</th>
                        <th className="px-6 py-3 font-bold text-xs">Hora</th>
                        <th className="px-6 py-3 font-bold text-xs">Pagos</th>
                        <th className="px-6 py-3 font-bold text-xs text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D9D9D2]/20">
                      {sales
                        .filter((s) => s.status === 'COMPLETED')
                        .map((sale) => (
                          <tr key={sale.id} className="hover:bg-[#FAFAFA]/50">
                            <td className="px-6 py-2.5 font-bold text-[#3F3F3F]">
                              #{sale.id.toString().padStart(6, '0')}
                            </td>
                            <td className="px-6 py-2.5 text-[#6B6B6B]">
                              {new Date(sale.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-6 py-2.5">
                              <div className="flex gap-1">
                                {sale.payments.map((p, i) => {
                                  const { icon } = getMethodLabel(p.method);
                                  return (
                                    <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#FAFAFA] rounded text-xs">
                                      {icon}
                                    </span>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="px-6 py-2.5 font-black text-[#3F3F3F] text-right">
                              S/ {Number(sale.total).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* ── Right Column: Cash Reconciliation ────────────── */}
          <div className="space-y-6">
            {/* Arqueo Panel */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#D9D9D2]/40">
              <div className="px-6 py-4 border-b border-[#D9D9D2]/40">
                <h2 className="text-base font-black text-[#3F3F3F] flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Arqueo de Caja
                </h2>
              </div>

              <div className="p-6 space-y-3">
                {/* Breakdown */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-[#6B6B6B] font-semibold">Monto Inicial</span>
                    <span className="font-black text-[#3F3F3F]">S/ {openAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-blue-700 font-semibold flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" /> Ingresos
                    </span>
                    <span className="font-black text-blue-700">+ S/ {totalIngresos.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-red-600 font-semibold flex items-center gap-1.5">
                      <TrendingDown className="w-3.5 h-3.5" /> Egresos
                    </span>
                    <span className="font-black text-red-600">- S/ {totalEgresos.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5" /> Ventas ({salesCount})
                    </span>
                    <span className="font-black text-emerald-700">+ S/ {totalVentas.toFixed(2)}</span>
                  </div>
                </div>

                {/* Expected total */}
                <div className="border-t border-[#D9D9D2]/40 pt-3">
                  <div className="bg-[#3F3F3F] text-white rounded-xl p-4 flex justify-between items-center">
                    <span className="text-sm font-bold">Monto Esperado</span>
                    <span className="text-xl font-black">S/ {expectedAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Close amount input */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-[#6B6B6B] mb-1.5">
                    Monto físico en caja (S/)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Contar y registrar"
                    value={closeAmount}
                    onKeyDown={handleNumericKeyDown}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val < 0) return;
                      setCloseAmount(e.target.value);
                    }}
                    className="w-full border border-[#D9D9D2] rounded-lg px-3 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-[#3F3F3F]/20 text-center text-lg"
                  />
                </div>

                {/* Difference indicator */}
                {closeAmount && (
                  <div className={`rounded-xl p-3 text-center ${
                    difference === 0 ? 'bg-emerald-50 border border-emerald-200' :
                    difference > 0 ? 'bg-blue-50 border border-blue-200' :
                    'bg-red-50 border border-red-200'
                  }`}>
                    <p className="text-xs font-semibold text-[#6B6B6B]">Diferencia</p>
                    <p className={`text-lg font-black ${
                      difference === 0 ? 'text-emerald-700' :
                      difference > 0 ? 'text-blue-700' : 'text-red-600'
                    }`}>
                      {difference >= 0 ? '+' : ''} S/ {difference.toFixed(2)}
                    </p>
                    <p className="text-xs text-[#6B6B6B] mt-0.5">
                      {difference === 0 ? 'Cuadre perfecto ✓' :
                       difference > 0 ? 'Sobrante' : 'Faltante'}
                    </p>
                  </div>
                )}

                {/* Close button */}
                <button
                  onClick={() => setShowCloseModal(true)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all shadow-sm text-sm flex items-center justify-center gap-2 mt-2"
                >
                  <Lock className="w-4 h-4" />
                  Cerrar Turno
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close Confirmation Modal */}
      <ConfirmModal
        isOpen={showCloseModal}
        title="¿Cerrar turno de caja?"
        message={`Se cerrará el turno con ${salesCount} venta(s) y un monto esperado de S/ ${expectedAmount.toFixed(2)}.${
          closeAmount ? ` Monto declarado: S/ ${parseFloat(closeAmount).toFixed(2)}.` : ' No se declaró monto físico.'
        } Esta acción no se puede deshacer.`}
        confirmText="Cerrar Turno"
        cancelText="Cancelar"
        isLoading={closingTurn}
        onConfirm={handleCloseTurn}
        onCancel={() => setShowCloseModal(false)}
      />
    </div>
  );
};

export default CloseTurnPage;
