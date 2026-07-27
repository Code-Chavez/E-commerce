import React, { useState } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';
import { PackageCheck, Search, HelpCircle, Loader2, Sparkles, Building2, Archive } from 'lucide-react';
import { handleNumericKeyDown } from '@/shared/validation/documentValidators';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';

interface VariantStock {
  variantId: number;
  sku: string;
  branchId: number;
  branchName: string;
  currentQty: number;
}

const AdjustmentPage: React.FC = () => {
  useDocumentTitle('Ajuste de Inventario - E-Commerce');

  const [sku, setSku] = useState('');
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<VariantStock | null>(null);
  const [newQuantity, setNewQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim()) return;
    setSearching(true);
    setResult(null);
    try {
      const { data } = await axiosInstance.get(`/v1/stock/by-sku?sku=${encodeURIComponent(sku.trim())}`);
      setResult(data.data);
      setNewQuantity(String(data.data.currentQty));
    } catch {
      toast.error('Variante no encontrada para el SKU ingresado');
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result) return;

    const qty = parseFloat(newQuantity);
    if (isNaN(qty) || qty < 0) { toast.error('Cantidad inválida'); return; }
    if (reason.trim().length < 10) { toast.error('La justificación debe tener al menos 10 caracteres'); return; }

    setSubmitting(true);
    try {
      await axiosInstance.post('/v1/stock/adjustments', {
        variantId: result.variantId,
        branchId: result.branchId,
        newQuantity: qty,
        reason: reason.trim(),
      });
      toast.success('Ajuste registrado correctamente');
      setResult(null);
      setSku('');
      setNewQuantity('');
      setReason('');
    } catch {
      toast.error('Error al registrar el ajuste');
    } finally {
      setSubmitting(false);
    }
  };

  const delta = result ? parseFloat(newQuantity || '0') - result.currentQty : 0;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#D9D9D2]/40 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#3F3F3F]/80 uppercase tracking-widest mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Módulo transaccional</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#3F3F3F] tracking-tight">
            Ajuste Manual de Stock
          </h1>
          <p className="text-sm text-[#6B6B6B] mt-1 max-w-xl">
            Corrige y concilia de manera directa las existencias lógicas de una variante. Esta acción generará asientos inmediatos en Kardex.
          </p>
        </div>
      </div>

      {/* Search form bar */}
      <div className="bg-white rounded-2xl border border-[#D9D9D2]/30 p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-[#3F3F3F] uppercase tracking-wider flex items-center gap-1.5">
          <Search className="w-4 h-4 text-[#6B6B6B]" />
          <span>Localizar Variante a Ajustar</span>
        </h3>
        
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D9D9D2]/70 bg-[#FAFAFA] text-sm text-[#3F3F3F] placeholder-[#6B6B6B]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]/20 focus:border-[#3F3F3F] transition-all"
              placeholder="Ingresa el SKU exacto de la variante (ej: CAM-BLK-M)..."
              value={sku}
              onChange={e => setSku(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            disabled={searching} 
            className="bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 text-white px-5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0"
          >
            {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            <span>Buscar</span>
          </button>
        </form>
      </div>

      {/* Result details and Form */}
      {result && (
        <form onSubmit={handleSubmit} className="bg-white border border-[#D9D9D2]/30 rounded-2xl p-6 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-[#3F3F3F] flex items-center gap-2 border-b border-[#D9D9D2]/40 pb-3">
            <Archive className="w-4 h-4 text-[#6B6B6B]" />
            <span>Formulario de Conciliación Directa</span>
          </h3>

          {/* Current Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-[#FAFAFA] rounded-xl p-3.5 border border-[#D9D9D2]/40">
              <span className="block text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider mb-1">SKU</span>
              <span className="font-extrabold text-[#3F3F3F] break-all">{result.sku}</span>
            </div>
            
            <div className="bg-[#FAFAFA] rounded-xl p-3.5 border border-[#D9D9D2]/40">
              <span className="block text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider mb-1">Sucursal Sede</span>
              <span className="font-extrabold text-[#3F3F3F] flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                <span>{result.branchName}</span>
              </span>
            </div>

            <div className="bg-[#FAFAFA] rounded-xl p-3.5 border border-[#D9D9D2]/40">
              <span className="block text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider mb-1">Stock Actual</span>
              <span className="font-extrabold text-[#3F3F3F] text-sm">{result.currentQty} uds.</span>
            </div>

            <div className={`rounded-xl p-3.5 border transition-colors ${
              delta === 0 
                ? 'bg-[#FAFAFA] border-[#D9D9D2]/40 text-[#3F3F3F]' 
                : delta > 0 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <span className="block text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider mb-1">Ajuste Neto</span>
              <span className="font-extrabold text-sm">
                {delta > 0 ? `+${delta}` : delta} uds.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            
            {/* New Quantity */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-[#3F3F3F] uppercase tracking-wider mb-2">
                Nueva cantidad física *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full px-4 py-2.5 rounded-xl border border-[#D9D9D2]/70 bg-[#FAFAFA] text-sm text-[#3F3F3F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]/20 focus:border-[#3F3F3F] transition-all font-bold"
                value={newQuantity}
                onKeyDown={handleNumericKeyDown}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (val < 0) return;
                  setNewQuantity(e.target.value);
                }}
                required
              />
            </div>

            {/* Justification reason */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#3F3F3F] uppercase tracking-wider mb-2">
                Justificación del Ajuste * <span className="text-gray-400 font-normal lowercase">(Mín. 10 caract.)</span>
              </label>
              <textarea
                rows={3}
                className={`w-full px-4 py-2.5 rounded-xl border bg-[#FAFAFA] text-sm text-[#3F3F3F] placeholder-[#6B6B6B]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]/20 focus:border-[#3F3F3F] transition-all resize-none ${
                  reason.length > 0 && reason.length < 10 ? 'border-red-400 ring-1 ring-red-500/25' : 'border-[#D9D9D2]/70'
                }`}
                placeholder="Describe el motivo (ej: Merma por rotura, error de conteo inicial...)"
                value={reason}
                onChange={e => setReason(e.target.value)}
                required
              />
              {reason.length > 0 && reason.length < 10 && (
                <p className="text-red-500 text-[10px] mt-1.5 font-semibold">Faltan {10 - reason.length} caracteres para cumplir el mínimo de seguridad.</p>
              )}
            </div>

          </div>

          <div className="flex gap-3 pt-4 border-t border-[#D9D9D2]/30">
            <button
              type="submit"
              disabled={submitting || reason.trim().length < 10}
              className="flex-grow flex items-center justify-center gap-2 bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 text-white py-3.5 rounded-xl transition-all text-xs font-bold shadow-lg shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <PackageCheck size={16} />}
              <span>{submitting ? 'Registrando Ajuste...' : 'Registrar Ajuste Físico'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Safe adjustments guidelines card */}
      <div className="p-4 bg-[#F7F7F5]/80 rounded-2xl border border-[#D9D9D2]/30 flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-[#6B6B6B] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-[#6B6B6B] space-y-1">
          <span className="font-semibold text-[#3F3F3F]">Auditoría y Trazabilidad de Ajustes:</span>
          <p>
            Cualquier alteración manual de stock está sujeta a auditoría regulatoria inmediata. Los registros de ajuste se vinculan con el ID del operador activo y se informan en el reporte mensual de varianzas comerciales de E-Commerce.
          </p>
        </div>
      </div>

    </div>
  );
};

export default AdjustmentPage;
