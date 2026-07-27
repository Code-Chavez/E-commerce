import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';
import { usePos } from './context/PosContext';
import { usePosCart } from './hooks/usePosCart';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import type { PosProduct } from './types/pos.types';
import { DiscountPanel, PaymentPanel } from '@/features/pos';
import { LoyaltyPanel } from './components/LoyaltyPanel';
import type { DiscountResult } from '@/features/pos';
import type { PaymentItem } from './components/PaymentPanel';
import type { ReceiptType } from './types/pos.types';
import { Receipt, type ReceiptData } from './components/Receipt';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus,
  Minus, 
  Sparkles, 
  PlusCircle, 
  Loader2, 
  Scan,
  CheckCircle2,
  Building2
} from 'lucide-react';

import { ClientSearchBar } from './components/ClientSearchBar';
import { CrossBranchStockModal } from './components/CrossBranchStockModal';
import { CrossBranchTag } from './components/CrossBranchTag';

export const PossScreen: React.FC = () => {
  useDocumentTitle('Punto de Venta (POS) - D\'Mendoza');
  
  const { activeRegister, branchId, igvExempt } = usePos();
  const { cartItems, addItem, updateQty, removeItem, clearCart, totals } = usePosCart(igvExempt);

  // Search and Product List States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PosProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Discount State (HU-034)
  const [discountResult, setDiscountResult] = useState<DiscountResult | null>(null);
  const [loyaltyDiscountAmount, setLoyaltyDiscountAmount] = useState<number>(0);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [saleCounter, setSaleCounter] = useState(0);

  // Key para forzar el re-mount de PaymentPanel y DiscountPanel al vaciar/confirmar
  const [_panelKey, setPanelKey] = useState(0);
  const resetPanels = () => setPanelKey(k => k + 1);

  // Cross Branch Stock States (HU-023)
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [consultVariant, setConsultVariant] = useState<{ id: number; name: string } | null>(null);

  // Cross Branch Sale States (HU-025)
  const [isCrossBranch, setIsCrossBranch] = useState(false);
  const [sourceBranchId, setSourceBranchId] = useState<number | null>(null);
  const [sourceBranchName, setSourceBranchName] = useState('');

  // Reset discount and cross-branch state if cart changes
  useEffect(() => {
    setDiscountResult(null);
    setLoyaltyDiscountAmount(0);
  }, [cartItems]);

  useEffect(() => {
    if (cartItems.length === 0) {
      setIsCrossBranch(false);
      setSourceBranchId(null);
      setSourceBranchName('');
    }
  }, [cartItems]);

  const finalTotal = Math.max(0, totals.total - (discountResult?.discountAmount || 0) - loyaltyDiscountAmount);

  const cartForDiscount = cartItems.map(item => ({
    variantId: item.variantId,
    quantity: item.quantity,
    unitPrice: item.price
  }));

  // Client Link State (HU-033)
  const [linkedClient, setLinkedClient] = useState<{ id: number; name: string; documentId: string } | null>(null);

  // References for barcode scanner (T-119)
  const searchInputRef = useRef<HTMLInputElement>(null);
  const keyTimesRef = useRef<number[]>([]);

  // Fetch some initial popular products in this branch when page loads
  useEffect(() => {
    const fetchInitialProducts = async () => {
      if (!branchId) return;
      setLoadingInitial(true);
      try {
        // Query empty or generic search to fetch top branch items
        const { data } = await axiosInstance.get(`/v1/pos/products?sku=`);
        if (data.success) {
          setSearchResults(data.data.slice(0, 8)); // Top 8 items
        }
      } catch {
        toast.error('Error al precargar catálogo de productos');
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchInitialProducts();
  }, [branchId]);

  // Main search function returning matching items
  const handleSearch = async (queryStr: string): Promise<PosProduct[]> => {
    if (!queryStr.trim()) {
      setSearchResults([]);
      return [];
    }
    setSearching(true);
    try {
      const { data } = await axiosInstance.get(`/v1/pos/products?sku=${encodeURIComponent(queryStr)}`);
      if (data.success) {
        setSearchResults(data.data);
        return data.data;
      }
      return [];
    } catch {
      toast.error('Error al buscar productos');
      return [];
    } finally {
      setSearching(false);
    }
  };

  // Debounced/Triggered search input handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    
    // Perform standard search after short delay
    const delayDebounce = setTimeout(() => {
      handleSearch(val);
    }, 300);

    return () => clearTimeout(delayDebounce);
  };

  const handleCheckout = async (payments: PaymentItem[], receiptType: ReceiptType) => {
    if (cartItems.length === 0) {
      toast.error('El carrito de ventas está vacío');
      return;
    }

    setCheckoutLoading(true);
    try {
      // Build items array matching backend expected format
      const itemsForBackend = cartItems.map(item => ({
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: item.price,
        // Calculate proportional discount if needed, or pass 0.
        // For HU-035 we simplify to 0 unless it's handled properly by the backend.
        // Since we are overriding discountAmount in the controller if needed, we'll send it as 0 here,
        // or apply the discountResult.discountAmount to the first item (just a mockup for now).
        discountAmount: discountResult?.discountAmount ? Number((discountResult.discountAmount / cartItems.length).toFixed(2)) : 0
      }));

      const res = await axiosInstance.post('/v1/pos/sales', {
        branchId: activeRegister?.branchId || branchId || 1, // Fallback to branch 1 if undefined
        clientId: linkedClient?.id || undefined,
        subtotal: totals.subtotal,
        discountTotal: (discountResult?.discountAmount || 0) + loyaltyDiscountAmount,
        total: finalTotal,
        items: itemsForBackend,
        isCrossBranch,
        sourceBranchId: isCrossBranch ? sourceBranchId : undefined,
        payments: payments.map(p => ({
          method: p.method,
          amount: p.amount
        })),
        documentType: receiptType,
        receiptType
      });

      if (res.data.success) {
        // Fetch receipt
        if (res.data.data?.id) {
          try {
            const receiptRes = await axiosInstance.get(`/v1/pos/sales/${res.data.data.id}/receipt`);
            if (receiptRes.data.success) {
              const fetchedReceipt = receiptRes.data.data;
              if (isCrossBranch) {
                fetchedReceipt.isCrossBranch = true;
                fetchedReceipt.sourceBranchName = sourceBranchName;
              }
              
              // Calculate true change based on frontend entered payments
              const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
              const change = totalPaid - finalTotal;
              
              // Inject true payments and change into receipt data so it prints accurately
              fetchedReceipt.totals.paid = totalPaid;
              fetchedReceipt.totals.change = Math.max(0, change);
              fetchedReceipt.payments = payments.map(p => ({
                method: p.method,
                amount: p.amount
              }));
              
              setReceiptData(fetchedReceipt);
            }
          } catch (e) {
            console.error('Error fetching receipt:', e);
          }
        }

        // Display toast notification for change
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        const change = totalPaid - finalTotal;

        if (change > 0) {
          toast.success(`¡Venta procesada con éxito! Vuelto: S/. ${change.toFixed(2)}`);
        } else {
          toast.success('¡Venta procesada con éxito!');
        }

        clearCart();
        setDiscountResult(null);
        setLoyaltyDiscountAmount(0);
        setLinkedClient(null);
        resetPanels();
        setSaleCounter(c => c + 1);
      }
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.error || 'Error procesando la venta';
      toast.error(msg);
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Keyboard shortcut & automatic fast barcode scanner listener (T-119)
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // F2 focuses the search box instantly
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        toast.success('Buscador enfocado (Modo lector listo)', { duration: 1500 });
        return;
      }

      // Barcode Scanner detection logic:
      // Scanners input characters very rapidly and finish with "Enter"
      const now = performance.now();
      keyTimesRef.current.push(now);

      // Keep only the last 5 keypress times to calculate running average
      if (keyTimesRef.current.length > 5) {
        keyTimesRef.current.shift();
      }

      // If user presses Enter in search box, check if it was entered rapidly (automatic scanner)
      if (e.key === 'Enter' && document.activeElement === searchInputRef.current) {
        e.preventDefault();
        
        // Calculate average time between keypresses
        let isScanner = false;
        if (keyTimesRef.current.length >= 2) {
          const intervals = [];
          for (let i = 1; i < keyTimesRef.current.length; i++) {
            intervals.push(keyTimesRef.current[i] - keyTimesRef.current[i - 1]);
          }
          const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
          // Standard typing speed is > 150ms per key. Scanners are typically < 30ms.
          // Requirement: auto-submit on Enter after rapid read (< 200ms between characters).
          if (avgInterval < 200) {
            isScanner = true;
          }
        }

        const scanQuery = searchQuery.trim();
        if (scanQuery) {
          // Instantly query server for the exact SKU
          const results = await handleSearch(scanQuery);
          
          if (results.length > 0) {
            // Find an exact SKU match to prevent adding wrong products on generic text
            const exactMatch = results.find(
              (p) => p.sku.toLowerCase() === scanQuery.toLowerCase()
            );

            if (exactMatch) {
              addItem(exactMatch, 1);
              setSearchQuery(''); // Clean instantly for the next scan
              
              if (isScanner) {
                toast.success(`Código de barras leído: ${exactMatch.sku}`, { icon: '🏷️' });
              }
            } else if (results.length === 1) {
              // If only one product returned (even if not exact match) we can add it for fast flow
              addItem(results[0], 1);
              setSearchQuery('');
            } else {
              toast.error('Múltiples coincidencias. Selecciona manualmente.', { icon: '🔍' });
            }
          } else {
            toast.error(`No se encontró ningún producto con SKU: "${scanQuery}"`, { icon: '❌' });
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery, addItem]);

  return (
    <>
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300 print:hidden">
      
      {/* POS Top Title / Meta Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#D9D9D2]/40 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#3F3F3F]/80 uppercase tracking-widest mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#3F3F3F]" />
            <span>Módulo de Facturación Frecuente</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#3F3F3F] tracking-tight flex items-center gap-2">
            Punto de Venta (POS)
          </h1>
        </div>

        {activeRegister && (
          <div className="flex items-center gap-2.5 px-4 py-2 bg-[#F7F7F5] border border-[#D9D9D2]/70 rounded-2xl shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-xs font-bold text-[#3F3F3F] uppercase tracking-wider">
              {activeRegister.name}
            </span>
          </div>
        )}
      </div>

      {/* Grid workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Catalog / Product Search (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Search Box */}
          <div className="bg-white p-4 rounded-2xl border border-[#D9D9D2]/60 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-[#3F3F3F] uppercase tracking-wider flex items-center gap-1.5">
                <Scan className="w-3.5 h-3.5 text-[#6B6B6B]" />
                <span>Búsqueda de Prendas y Variantes</span>
              </label>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-semibold text-gray-500 bg-[#FAFAFA] border rounded shadow-sm">
                Presiona F2
              </kbd>
            </div>
            
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                placeholder="Escribe el nombre o escanea el código de barras (SKU)..."
                className="w-full pl-10 pr-4 py-3 bg-[#FAFAFA] border border-[#D9D9D2]/80 rounded-xl outline-none text-sm text-[#3F3F3F] placeholder-[#6B6B6B]/40 focus:ring-2 focus:ring-[#3F3F3F]/15 focus:border-[#3F3F3F] transition-all font-semibold"
              />
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B6B6B]/60">
                {searching ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#3F3F3F]" />
                ) : (
                  <Search className="w-4.5 h-4.5" />
                )}
              </div>
            </div>

            {/* Client Search and Registration Area (HU-033 / T-123) */}
            <div className="pt-3 border-t border-[#D9D9D2]/30">
              <ClientSearchBar 
                linkedClient={linkedClient} 
                onSelectClient={setLinkedClient} 
              />
            </div>

            {/* Loyalty Points Panel */}
            <LoyaltyPanel 
              clientId={linkedClient?.id || null} 
              onDiscountApplied={(amount) => setLoyaltyDiscountAmount(amount)}
            />
          </div>

          {/* Results Area */}
          <div className="bg-white rounded-2xl border border-[#D9D9D2]/60 shadow-sm overflow-hidden flex flex-col max-h-[500px]">
            <div className="px-4 py-3 bg-[#F7F7F5] border-b border-[#D9D9D2]/40 flex justify-between items-center">
              <span className="text-xs font-bold text-[#3F3F3F] uppercase tracking-wider">Catálogo Disponible</span>
              <span className="text-[10px] bg-[#3F3F3F]/10 text-[#3F3F3F] font-bold px-2 py-0.5 rounded-full">
                {searchResults.length} variantes
              </span>
            </div>

            <div className="divide-y divide-[#D9D9D2]/30 overflow-y-auto flex-1">
              {loadingInitial ? (
                <div className="p-12 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-[#3F3F3F]" />
                  <span className="text-xs text-[#6B6B6B] font-semibold">Cargando variantes de tienda...</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-12 text-center text-xs text-[#6B6B6B]/70 space-y-1">
                  <p className="font-bold text-[#3F3F3F]">Sin resultados en la búsqueda</p>
                  <p>Intenta tecleando palabras clave o usa el lector de código de barras físico.</p>
                </div>
              ) : (
                searchResults.map((prod) => {
                  const outOfStock = prod.stock <= 0;
                  return (
                    <div 
                      key={prod.variantId} 
                      className={`p-4 flex items-center justify-between gap-4 hover:bg-[#F7F7F5]/50 transition-colors ${
                        outOfStock ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-[#3F3F3F] truncate">{prod.name}</div>
                        <div className="text-[10px] text-[#6B6B6B] mt-0.5 font-mono">{prod.sku}</div>
                        <div className="flex gap-1.5 mt-1.5">
                          {Object.entries(prod.attributes).map(([key, val]) => (
                            <span key={key} className="text-[9px] bg-[#F7F7F5] border border-[#D9D9D2]/40 text-[#6B6B6B] px-1.5 py-0.5 rounded-md font-semibold">
                              {key}: {val}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 flex items-center gap-4">
                        <div>
                          <div className="font-extrabold text-sm text-[#3F3F3F]">S/. {prod.price.toFixed(2)}</div>
                          <div className={`text-[10px] font-bold mt-1 ${
                            prod.stock <= 5 ? 'text-rose-600' : 'text-emerald-700'
                          }`}>
                            {outOfStock ? 'Agotado' : `${prod.stock} disp.`}
                          </div>
                        </div>

                        <button
                          onClick={() => addItem(prod)}
                          className={`p-2 rounded-xl transition-all shadow hover:scale-105 cursor-pointer ${
                            outOfStock
                              ? 'bg-amber-600 hover:bg-amber-700 text-white'
                              : 'bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 text-white'
                          }`}
                          title={outOfStock ? "Consultar/Vincular prenda sin stock" : "Agregar prenda"}
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Sales Cart & Totals Panel (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Cart Table Container */}
          <div className="bg-white rounded-2xl border border-[#D9D9D2]/60 shadow-sm overflow-hidden flex flex-col min-h-[350px]">
            
            {/* Cart Header */}
            <div className="px-5 py-4 bg-[#F7F7F5] border-b border-[#D9D9D2]/40 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[#3F3F3F]" />
                <span className="text-xs font-bold text-[#3F3F3F] uppercase tracking-wider">Carrito de Facturación</span>
              </div>
              
              {cartItems.length > 0 && (
                <button
                  onClick={() => {
                    clearCart();
                    setDiscountResult(null);
                    setLoyaltyDiscountAmount(0);
                    resetPanels();
                  }}
                  className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Vaciar
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="flex-1 divide-y divide-[#D9D9D2]/20 overflow-y-auto">
              {cartItems.length === 0 ? (
                <div className="p-20 text-center flex flex-col items-center justify-center gap-3">
                  <div className="p-4 bg-[#F7F7F5] text-gray-400 rounded-full border border-dashed border-[#D9D9D2]">
                    <ShoppingCart className="w-8 h-8 stroke-[1.5]" />
                  </div>
                  <h3 className="text-sm font-bold text-[#3F3F3F]">Carrito vacío</h3>
                  <p className="text-xs text-[#6B6B6B] max-w-xs">
                    Busca productos en el buscador de la izquierda o escanea con el lector láser de código de barras para comenzar.
                  </p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.variantId} className="p-4 flex items-center justify-between gap-4 hover:bg-[#FAFAFA]/40 transition-colors">
                    
                    {/* Item Information */}
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm text-[#3F3F3F] truncate">{item.name}</div>
                      <div className="text-[10px] text-[#6B6B6B] font-mono mt-0.5">{item.sku}</div>
                      <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        {Object.entries(item.attributes).map(([k, v]) => (
                          <span key={k} className="text-[9px] bg-[#FAFAFA] border text-gray-500 px-1.5 py-0.5 rounded font-semibold">
                            {k}: {v}
                          </span>
                        ))}
                        {item.stock <= 0 && (
                          <span className="text-[9px] bg-amber-50 border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                            Sin Stock Local
                          </span>
                        )}
                        {item.stock <= 0 && isCrossBranch && sourceBranchName && (
                          <CrossBranchTag branchName={sourceBranchName} />
                        )}
                      </div>
                    </div>

                    {/* Inline edit of quantities (T-118 Requirement) */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      
                      {/* Price per Unit */}
                      <div className="text-right">
                        <div className="text-[10px] text-[#6B6B6B] font-semibold">Precio Unit.</div>
                        <div className="font-bold text-xs text-[#3F3F3F]">S/. {item.price.toFixed(2)}</div>
                      </div>

                      {/* Quantity Selectors */}
                      <div className="flex items-center bg-[#F7F7F5] border border-[#D9D9D2] rounded-xl px-1.5 py-1">
                        <button
                          onClick={() => updateQty(item.variantId, item.quantity - 1)}
                          className="p-1 hover:bg-[#D9D9D2] rounded-lg transition-colors text-[#3F3F3F]"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 font-extrabold text-sm text-[#3F3F3F] min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.variantId, item.quantity + 1)}
                          className="p-1 hover:bg-[#D9D9D2] rounded-lg transition-colors text-[#3F3F3F]"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Total accumulated line */}
                      <div className="text-right w-20">
                        <div className="text-[10px] text-[#6B6B6B] font-semibold">Subtotal</div>
                        <div className="font-extrabold text-sm text-[#3F3F3F]">
                          S/. {(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>

                      {/* Cross branch consultation button */}
                      {item.stock <= 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setConsultVariant({ id: item.variantId, name: item.name });
                            setIsStockModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                          title="Consultar stock en otras sucursales"
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          <span>Ver Sedes</span>
                        </button>
                      )}

                      {/* Delete item button */}
                      <button
                        onClick={() => removeItem(item.variantId)}
                        className="p-2 text-[#6B6B6B] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Eliminar de carrito"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>

                  </div>
                ))
              )}
            </div>

            {/* Sub-panel totals (IGV / Tax desglosado - T-118 Requirement) */}
            <div className="bg-[#F7F7F5] p-5 border-t border-[#D9D9D2]/50 space-y-4">
              <div className="grid grid-cols-2 gap-y-2.5 text-sm">
                <span className="text-[#6B6B6B] font-semibold">Subtotal:</span>
                <span className="text-right text-[#3F3F3F] font-bold">S/. {totals.subtotal.toFixed(2)}</span>

                {igvExempt ? (
                  <>
                    <span className="text-[#6B6B6B] font-semibold">IGV:</span>
                    <span className="text-right text-emerald-600 font-bold text-xs">Exonerado (Zona Selva)</span>
                  </>
                ) : (
                  <>
                    <span className="text-[#6B6B6B] font-semibold">IGV (18% Incluido):</span>
                    <span className="text-right text-[#3F3F3F] font-bold">S/. {totals.tax.toFixed(2)}</span>
                  </>
                )}
                
                {discountResult && (
                  <>
                    <span className="text-[#c0392b] font-semibold">
                      Descuento ({discountResult.discountType === 'percentage' ? `${discountResult.discountValue}%` : 'Fijo'}):
                    </span>
                    <span className="text-right text-[#c0392b] font-bold">
                      - S/. {discountResult.discountAmount.toFixed(2)}
                    </span>
                  </>
                )}

                {loyaltyDiscountAmount > 0 && (
                  <>
                    <span className="text-yellow-600 font-semibold">
                      Descuento por Puntos:
                    </span>
                    <span className="text-right text-yellow-600 font-bold">
                      - S/. {loyaltyDiscountAmount.toFixed(2)}
                    </span>
                  </>
                )}

                <div className="col-span-2 border-t border-[#D9D9D2]/40 my-1"></div>
                
                <span className="text-base font-extrabold text-[#3F3F3F] uppercase tracking-wider">Total a Cobrar:</span>
                <span className="text-right text-xl font-extrabold text-[#3F3F3F]">S/. {finalTotal.toFixed(2)}</span>
              </div>

              {/* Discount Panel */}
              <div className="pt-2 border-t border-[#D9D9D2]/50">
                <DiscountPanel
                  key={`discount-${saleCounter}`}
                  items={cartForDiscount}
                  onDiscountApplied={setDiscountResult}
                />
              </div>

              {/* Payment Panel */}
              <div className="pt-2">
                <PaymentPanel
                  key={`payment-${saleCounter}`}
                  totalAmount={finalTotal}
                  onConfirm={handleCheckout}
                  isLoading={checkoutLoading}
                />
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>

      {receiptData && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-2xl font-extrabold text-[#3F3F3F]">¡Venta Exitosa!</h2>
              <p className="text-[#6B6B6B]">El comprobante ha sido generado correctamente.</p>
              {receiptData.totals.change > 0 && (
                <div className="mt-4 p-4 bg-[#F7F7F5] rounded-xl border-2 border-green-500 text-green-700 font-bold text-xl">
                  VUELTO: S/. {receiptData.totals.change.toFixed(2)}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setReceiptData(null)}
                className="flex-1 py-3 bg-[#F7F7F5] text-[#3F3F3F] font-bold rounded-xl hover:bg-[#EBEBE8] transition-colors"
              >
                Nueva Venta
              </button>
              <button 
                onClick={() => window.print()}
                className="flex-1 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-900 transition-colors"
              >
                Imprimir Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      <CrossBranchStockModal
        isOpen={isStockModalOpen}
        onClose={() => {
          setIsStockModalOpen(false);
          setConsultVariant(null);
        }}
        variantId={consultVariant?.id || null}
        variantName={consultVariant?.name || ''}
        onSelectBranch={(branchId, branchName) => {
          setIsCrossBranch(true);
          setSourceBranchId(branchId);
          setSourceBranchName(branchName);
        }}
      />

      <Receipt data={receiptData} />
    </>
  );
};

export default PossScreen;
