import React, { useState } from 'react';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { useReconciliation } from './hooks/useReconciliation';
import { RefreshCw, Search, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export const ReconcilePage: React.FC = () => {
  useDocumentTitle('Conciliación - D\'Mendoza');
  
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  const { loading, result, error, reconcileStripe } = useReconciliation();

  const handleReconcile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromDate || !toDate) return;
    
    // Convert to ISO strings at start/end of day
    const from = new Date(fromDate + 'T00:00:00.000Z').toISOString();
    const to = new Date(toDate + 'T23:59:59.999Z').toISOString();
    
    reconcileStripe({ from, to });
  };

  const formatCurrency = (amount: number) => {
    return `S/ ${amount.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-accent/10 text-brand-accent flex items-center justify-center shrink-0">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-brand-accent tracking-tight">Conciliación de Pasarela</h2>
            <p className="text-xs text-brand-text mt-0.5">Identifique discrepancias entre los pagos de Stripe y los pedidos registrados.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <form onSubmit={handleReconcile} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-1/3">
            <label className="block text-xs font-bold text-gray-700 mb-1">Fecha Desde</label>
            <input
              type="date"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-colors"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="w-full md:w-1/3">
            <label className="block text-xs font-bold text-gray-700 mb-1">Fecha Hasta</label>
            <input
              type="date"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-colors"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div className="w-full md:w-auto">
            <button
              type="submit"
              disabled={loading || !fromDate || !toDate}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-accent text-white font-bold rounded-xl text-sm transition-all hover:bg-black disabled:opacity-50"
            >
              <Search className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Ejecutar Conciliación</span>
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-3xl text-center text-red-800 text-sm font-semibold shadow-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Pagos Coincidentes</p>
                <p className="text-2xl font-black text-gray-900">{result.matched.filter(m => m.status === 'MATCHED').length}</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Diferencia de Montos</p>
                <p className="text-2xl font-black text-gray-900">{result.matched.filter(m => m.status === 'AMOUNT_MISMATCH').length}</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">No Conciliados</p>
                <p className="text-2xl font-black text-gray-900">{result.unmatched.stripeOnly.length + result.unmatched.dbOnly.length}</p>
              </div>
            </div>
          </div>

          {/* Tabla de Pagos Conciliados Exitosamente */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <h3 className="font-extrabold text-emerald-700 text-sm">Pagos Conciliados Exitosamente (Coincidencia Perfecta)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white text-gray-500 font-bold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">ID Stripe</th>
                    <th className="px-6 py-4">ID Pedido (DB)</th>
                    <th className="px-6 py-4">Monto Stripe</th>
                    <th className="px-6 py-4">Monto DB</th>
                    <th className="px-6 py-4 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {result.matched.filter(m => m.status === 'MATCHED').length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No hay pagos conciliados en el período seleccionado.
                      </td>
                    </tr>
                  ) : (
                    result.matched.filter(m => m.status === 'MATCHED').map(item => (
                      <tr key={item.orderId} className="hover:bg-emerald-50/20 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-gray-900">{item.stripePaymentIntentId}</td>
                        <td className="px-6 py-4 font-mono text-xs text-gray-900">#{item.orderId}</td>
                        <td className="px-6 py-4 font-semibold text-gray-900">{formatCurrency(item.stripeAmount)}</td>
                        <td className="px-6 py-4 font-semibold text-gray-900">{formatCurrency(item.orderAmount)}</td>
                        <td className="px-6 py-4 text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            OK
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabla de Discrepancias */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <h3 className="font-extrabold text-gray-900 text-sm">Discrepancias (Mismatch de Montos)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white text-gray-500 font-bold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">ID Stripe</th>
                    <th className="px-6 py-4">ID Pedido (DB)</th>
                    <th className="px-6 py-4">Monto Stripe</th>
                    <th className="px-6 py-4">Monto DB</th>
                    <th className="px-6 py-4 text-right">Diferencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {result.matched.filter(m => m.status === 'AMOUNT_MISMATCH').length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No hay discrepancias de montos en el período seleccionado.
                      </td>
                    </tr>
                  ) : (
                    result.matched.filter(m => m.status === 'AMOUNT_MISMATCH').map(item => (
                      <tr key={item.orderId} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs">{item.stripePaymentIntentId}</td>
                        <td className="px-6 py-4 font-mono text-xs">{item.orderId}</td>
                        <td className="px-6 py-4">{formatCurrency(item.stripeAmount)}</td>
                        <td className="px-6 py-4">{formatCurrency(item.orderAmount)}</td>
                        <td className="px-6 py-4 text-right font-bold text-red-600">
                          {formatCurrency(Math.abs(item.stripeAmount - item.orderAmount))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Solo en Stripe */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-extrabold text-gray-900 text-sm">Solo en Stripe (Pagos sin Pedido)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-white text-gray-500 font-bold text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">ID Stripe</th>
                      <th className="px-6 py-4">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {result.unmatched.stripeOnly.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-6 py-8 text-center text-gray-500">
                          No hay registros exclusivos en Stripe.
                        </td>
                      </tr>
                    ) : (
                      result.unmatched.stripeOnly.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs">{item.id}</td>
                          <td className="px-6 py-4 font-bold">{formatCurrency(item.amount)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Solo en DB */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-extrabold text-gray-900 text-sm">Solo en BD (Pedidos sin Pago Stripe)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-white text-gray-500 font-bold text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">ID Pedido</th>
                      <th className="px-6 py-4">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {result.unmatched.dbOnly.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-6 py-8 text-center text-gray-500">
                          No hay pedidos sin conciliar en la Base de Datos.
                        </td>
                      </tr>
                    ) : (
                      result.unmatched.dbOnly.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs">{item.id}</td>
                          <td className="px-6 py-4 font-bold">{formatCurrency(item.total)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReconcilePage;
