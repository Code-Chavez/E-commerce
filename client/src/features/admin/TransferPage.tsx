import React, { useState, useEffect } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';
import { 
  Search, 
  Loader2, 
  ArrowLeftRight, 
  Sparkles, 
  Building2, 
  Package, 
  AlertCircle,
  Download,
  CheckCircle2,
  RefreshCw,
  Store
} from 'lucide-react';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { handleNumericKeyDown } from '@/shared/validation/documentValidators';
import { adminTransferService } from './services/adminTransferService';

interface Branch {
  id: number;
  name: string;
  isActive: boolean;
}

interface VariantStockInfo {
  variantId: number;
  sku: string;
  productName: string;
  globalStock: number;
  byBranch: {
    branchId: number;
    branchName: string;
    quantity: number;
  }[];
}

const TransferPage: React.FC = () => {
  useDocumentTitle('Transferencia de Mercadería - D\'Mendoza');

  // Branch list
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  // Form states
  const [fromBranchId, setFromBranchId] = useState<string>('');
  const [toBranchId, setToBranchId] = useState<string>('');
  const [sku, setSku] = useState('');
  const [quantity, setQuantity] = useState('');
  
  // Search state
  const [searching, setSearching] = useState(false);
  const [foundVariant, setFoundVariant] = useState<VariantStockInfo | null>(null);
  
  // Submit state
  const [submitting, setSubmitting] = useState(false);

  // Transfer Guide states
  const [lastTransferId, setLastTransferId] = useState<number | null>(null);
  const [downloadingGuide, setDownloadingGuide] = useState(false);

  const handleDownloadGuide = async (id: number) => {
    setDownloadingGuide(true);
    try {
      toast.loading('Generando Guía PDF...', { id: 'transfer-guide-download' });
      await adminTransferService.downloadTransferGuide(id);
      toast.success('Descarga iniciada con éxito', { id: 'transfer-guide-download' });
    } catch (err: any) {
      console.error(err);
      toast.error('Error al descargar la Guía de Transferencia', { id: 'transfer-guide-download' });
    } finally {
      setDownloadingGuide(false);
    }
  };

  // Fetch branches on mount
  useEffect(() => {
    const fetchBranches = async () => {
      setLoadingBranches(true);
      try {
        const { data } = await axiosInstance.get('/v1/branches');
        // Filter active branches only
        const activeBranches = (data.data || []).filter((b: Branch) => b.isActive);
        setBranches(activeBranches);
      } catch (err) {
        console.error('Error loading branches:', err);
        toast.error('Error al cargar la lista de sucursales');
      } finally {
        setLoadingBranches(false);
      }
    };
    fetchBranches();
  }, []);

  // Search variant by SKU
  const handleSearchVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim()) return;
    if (!fromBranchId) {
      toast.error('Por favor, selecciona primero la sucursal de origen');
      return;
    }

    setSearching(true);
    setFoundVariant(null);
    setLastTransferId(null);
    try {
      const { data } = await axiosInstance.get(`/v1/stock?sku=${encodeURIComponent(sku.trim())}`);
      if (data.success && data.data && data.data.length > 0) {
        setFoundVariant(data.data[0]); // GET /stock returns an array
        toast.success('Variante localizada correctamente');
      } else {
        toast.error('No se encontró ninguna variante con el SKU especificado');
      }
    } catch (err) {
      console.error('Error fetching stock:', err);
      toast.error('Error al buscar la variante');
    } finally {
      setSearching(false);
    }
  };

  // Get current stock of found variant in selected origin branch
  const getOriginStock = () => {
    if (!foundVariant || !fromBranchId) return 0;
    const originBranchStock = foundVariant.byBranch.find(
      (b) => b.branchId === parseInt(fromBranchId, 10)
    );
    return originBranchStock ? originBranchStock.quantity : 0;
  };

  const handleSubmitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromBranchId || !toBranchId || !foundVariant || !quantity) {
      toast.error('Por favor, completa todos los campos obligatorios');
      return;
    }

    const fromId = parseInt(fromBranchId, 10);
    const toId = parseInt(toBranchId, 10);
    if (fromId === toId) {
      toast.error('La sucursal de origen y destino no pueden ser la misma');
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error('La cantidad debe ser un número positivo mayor a 0');
      return;
    }

    const originStock = getOriginStock();
    if (qty > originStock) {
      toast.error(`Stock insuficiente en origen. Máximo disponible: ${originStock} unidades.`);
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await axiosInstance.post('/v1/stock-transfers', {
        fromBranchId: fromId,
        toBranchId: toId,
        variantId: foundVariant.variantId,
        quantity: qty,
      });

      if (data.success) {
        toast.success(`Transferencia de ${qty} unidades realizada con éxito`);
        if (data.data && data.data.id) {
          setLastTransferId(data.data.id);
        }
        // Reset states
        setFoundVariant(null);
        setSku('');
        setQuantity('');
      } else {
        toast.error(data.error || 'Error al procesar la transferencia');
      }
    } catch (err: any) {
      console.error('Error submitting stock transfer:', err);
      const errMsg = err.response?.data?.error || 'Error al procesar la transferencia interna';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const currentOriginStock = getOriginStock();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#D9D9D2]/40 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#3F3F3F]/80 uppercase tracking-widest mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Módulo de Distribución</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#3F3F3F] tracking-tight">
            Transferencia Interna entre Sedes
          </h1>
          <p className="text-sm text-[#6B6B6B] mt-1 max-w-2xl">
            Registra y ejecuta traslados de inventario entre sucursales de forma directa. Se recalcularán las existencias y se generarán los movimientos de Kardex de salida y entrada respectivos.
          </p>
        </div>
      </div>

      {/* Banner de descarga de Guía de Transferencia Interna */}
      {lastTransferId && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-emerald-900">¡Transferencia Procesada Exitosamente!</h3>
              <p className="text-xs text-emerald-700 mt-1">
                La mercadería ha sido trasladada en el sistema. Puedes descargar e imprimir la Guía de Transferencia Interna (PDF) correspondiente para amparar el traslado físico del stock.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleDownloadGuide(lastTransferId)}
            disabled={downloadingGuide}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
          >
            {downloadingGuide ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Descargar Guía</span>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmitTransfer} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Branch Selectors & Variant Search (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Sucursales Panel */}
          <div className="bg-white rounded-2xl border border-[#D9D9D2]/40 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[#3F3F3F] uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#6B6B6B]" />
              <span>1. Configurar Ruta de Transferencia</span>
            </h3>

            {loadingBranches ? (
              <div className="py-4 flex items-center gap-2 text-xs text-[#6B6B6B]">
                <Loader2 className="w-4 h-4 animate-spin text-[#3F3F3F]" />
                <span>Cargando sedes activas...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Source Branch */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#3F3F3F] uppercase tracking-wider">
                    Sucursal de Origen <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={fromBranchId}
                    onChange={(e) => {
                      setFromBranchId(e.target.value);
                      setFoundVariant(null); // Clear search when branch changes to enforce re-check
                    }}
                    className="w-full px-4 py-2.5 bg-[#F9F9F6] border border-[#D9D9D2] rounded-xl outline-none text-xs text-[#3F3F3F] font-bold focus:ring-1 focus:ring-[#3F3F3F] transition-all"
                    required
                  >
                    <option value="">-- Selecciona Origen --</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Destination Branch */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#3F3F3F] uppercase tracking-wider">
                    Sucursal de Destino <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={toBranchId}
                    onChange={(e) => setToBranchId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#F9F9F6] border border-[#D9D9D2] rounded-xl outline-none text-xs text-[#3F3F3F] font-bold focus:ring-1 focus:ring-[#3F3F3F] transition-all"
                    required
                  >
                    <option value="">-- Selecciona Destino --</option>
                    {branches
                      .filter((b) => String(b.id) !== fromBranchId)
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Variant Search Panel */}
          <div className="bg-white rounded-2xl border border-[#D9D9D2]/40 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[#3F3F3F] uppercase tracking-wider flex items-center gap-2">
              <Search className="w-4 h-4 text-[#6B6B6B]" />
              <span>2. Localizar Variante por SKU</span>
            </h3>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="Ej. CAM-M-ROJO (Escanea o digita el SKU)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F9F9F6] border border-[#D9D9D2] rounded-xl outline-none text-xs text-[#3F3F3F] placeholder-[#6B6B6B]/40 focus:ring-1 focus:ring-[#3F3F3F] transition-all font-semibold"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Search size={16} />
                </div>
              </div>
              <button
                type="button"
                onClick={handleSearchVariant}
                disabled={searching || !sku.trim() || !fromBranchId}
                className="px-4 bg-[#3F3F3F] hover:bg-[#3F3F3F]/95 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {searching && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Buscar</span>
              </button>
            </div>

            {!fromBranchId && (
              <p className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Debes seleccionar una sucursal de origen antes de buscar prendas.
              </p>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Selection Review & Submitting (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Info Card / Stock Review */}
          <div className="bg-white rounded-2xl border border-[#D9D9D2]/40 p-6 shadow-sm space-y-5">
            <h3 className="text-xs font-bold text-[#3F3F3F] uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-[#6B6B6B]" />
              <span>Resumen de Inventario</span>
            </h3>

            {foundVariant ? (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Details */}
                <div className="p-4 bg-[#F9F9F6] border border-[#D9D9D2]/40 rounded-xl space-y-2">
                  <div className="text-[10px] uppercase font-bold text-[#6B6B6B] tracking-wider leading-none">Prenda Localizada</div>
                  <div className="font-extrabold text-sm text-[#3F3F3F]">{foundVariant.productName}</div>
                  <div className="text-[11px] text-[#6B6B6B] font-mono leading-none">SKU: {foundVariant.sku}</div>
                </div>

                {/* Stock info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
                    <div className="text-[9px] uppercase font-bold text-emerald-800 tracking-wider">Disponible Origen</div>
                    <div className="text-xl font-extrabold text-emerald-950 mt-1">
                      {currentOriginStock} unds.
                    </div>
                  </div>
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-center">
                    <div className="text-[9px] uppercase font-bold text-indigo-800 tracking-wider">Stock Global</div>
                    <div className="text-xl font-extrabold text-indigo-950 mt-1">
                      {foundVariant.globalStock} unds.
                    </div>
                  </div>
                </div>

                {/* Form quantity and submit */}
                {currentOriginStock <= 0 ? (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2 text-rose-700 text-xs font-bold leading-tight">
                    <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                    <p>No hay existencias disponibles en la sucursal de origen seleccionada para realizar la transferencia.</p>
                  </div>
                ) : (
                  <div className="space-y-4 pt-2 border-t border-[#D9D9D2]/30">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#3F3F3F] uppercase tracking-wider">
                        Cantidad a Transferir <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={currentOriginStock}
                        value={quantity}
                        onKeyDown={handleNumericKeyDown}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (val < 0) return;
                          setQuantity(e.target.value);
                        }}
                        placeholder={`Máx. ${currentOriginStock}`}
                        className="w-full px-4 py-2.5 bg-[#F9F9F6] border border-[#D9D9D2] rounded-xl outline-none text-xs text-[#3F3F3F] font-bold focus:ring-1 focus:ring-[#3F3F3F] transition-all"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || !quantity || parseFloat(quantity) <= 0 || parseFloat(quantity) > currentOriginStock}
                      className="w-full py-3 bg-[#3F3F3F] hover:bg-[#3F3F3F]/95 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ArrowLeftRight className="w-4 h-4" />
                      )}
                      <span>Ejecutar Transferencia</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-10 text-center border-2 border-dashed border-[#D9D9D2] rounded-2xl text-xs text-[#6B6B6B] space-y-2">
                <AlertCircle className="w-8 h-8 mx-auto stroke-[1.5] text-[#D9D9D2]" />
                <p className="font-bold text-[#3F3F3F]">Sin prenda seleccionada</p>
                <p className="max-w-[200px] mx-auto text-[11px]">
                  Configura el origen y busca una variante por SKU para habilitar el traslado.
                </p>
              </div>
            )}
          </div>

        </div>

      </form>
    </div>
  );
};

export default TransferPage;
