import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';
import { usePos } from './context/PosContext';
import { useAuth } from '@/shared/context/AuthContext';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { handleNumericKeyDown } from '@/shared/validation/documentValidators';
import { Sparkles, Coins, Landmark, Landmark as BoxIcon, ArrowRight, Loader2, Info, Wallet, Store, History, Plus, FileText, CheckCircle2, ChevronRight, Calculator, User, Clock, CheckCircle, Search } from 'lucide-react';

interface Branch {
  id: number;
  name: string;
  isActive: boolean;
  igvExempt: boolean;
}

interface CashRegister {
  id: number;
  branchId: number;
  name: string;
}

const OpenCashPage: React.FC = () => {
  useDocumentTitle('Apertura de Caja - E-Commerce');
  const navigate = useNavigate();
  const { openShift, loading: posLoading, checkActiveShift } = usePos();

  const { user } = useAuth();
  
  const isRestrictedRole = user?.role !== 'ADMIN';
  const initialBranchId = isRestrictedRole && user?.branchId ? String(user.branchId) : '';

  const [branches, setBranches] = useState<Branch[]>([]);
  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [selectedBranch, setSelectedBranch] = useState(initialBranchId);
  const [selectedRegister, setSelectedRegister] = useState('');
  const [openAmount, setOpenAmount] = useState('0');
  const [loading, setLoading] = useState(false);
  const [fetchingRegisters, setFetchingRegisters] = useState(false);

  // If already open, redirect immediately to POS home
  useEffect(() => {
    checkActiveShift().then((hasShift) => {
      if (hasShift) {
        navigate('/pos');
      }
    });
  }, [checkActiveShift, navigate]);

  // Load active branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const { data } = await axiosInstance.get('/v1/branches');
        if (data.success) {
          // Only show active branches
          setBranches(data.data.filter((b: Branch) => b.isActive));
        }
      } catch {
        toast.error('Error al cargar sucursales');
      }
    };
    fetchBranches();
  }, []);

  // Load registers when branch changes
  useEffect(() => {
    if (!selectedBranch) {
      setRegisters([]);
      setSelectedRegister('');
      return;
    }
    const fetchRegisters = async () => {
      setFetchingRegisters(true);
      try {
        const { data } = await axiosInstance.get(`/v1/cash-registers?branchId=${selectedBranch}`);
        if (data.success) {
          setRegisters(data.data);
          setSelectedRegister('');
        }
      } catch {
        toast.error('Error al cargar cajas registradoras');
      } finally {
        setFetchingRegisters(false);
      }
    };
    fetchRegisters();
  }, [selectedBranch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch) {
      toast.error('Selecciona una sucursal');
      return;
    }
    if (!selectedRegister) {
      toast.error('Selecciona una caja registradora');
      return;
    }
    const amount = parseFloat(openAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error('El monto de apertura no puede ser negativo');
      return;
    }

    setLoading(true);
    try {
      const selectedBranchData = branches.find(b => b.id === parseInt(selectedBranch, 10));
      await openShift(parseInt(selectedRegister, 10), amount, parseInt(selectedBranch, 10), selectedBranchData?.igvExempt ?? false);
      navigate('/pos');
    } catch {
      // Errors are already handled by PosContext and trigger toasts
    } finally {
      setLoading(false);
    }
  };

  if (posLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-[#3F3F3F] border-t-[#D9D9D2] rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-[#3F3F3F] animate-pulse">Verificando sesión de caja...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-300">
      <div className="max-w-md w-full space-y-8 bg-white border border-[#D9D9D2]/40 rounded-3xl p-8 shadow-xl">
        
        {/* Visual Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FAFAFA] border border-[#D9D9D2]/30 text-[#3F3F3F] mb-2 shadow-sm">
            <Coins className="w-6 h-6" />
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#3F3F3F]/80 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Módulo POS Express</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#3F3F3F] tracking-tight">
            Apertura de Caja
          </h2>
          <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto">
            Registra el estado de saldo inicial y vincula tu sesión para habilitar las operaciones de facturación física.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            
            {/* Branch Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#3F3F3F] uppercase tracking-wider flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-[#6B6B6B]" />
                <span>Sucursal de Venta *</span>
              </label>
              <select
                required
                disabled={isRestrictedRole}
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border border-[#D9D9D2]/70 bg-[#FAFAFA] text-sm text-[#3F3F3F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]/20 focus:border-[#3F3F3F] transition-all font-semibold ${isRestrictedRole ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <option value="">Seleccione una sucursal...</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Cash Register Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#3F3F3F] uppercase tracking-wider flex items-center gap-1.5">
                <BoxIcon className="w-3.5 h-3.5 text-[#6B6B6B]" />
                <span>Caja Registradora *</span>
              </label>
              <select
                required
                disabled={!selectedBranch || fetchingRegisters}
                value={selectedRegister}
                onChange={(e) => setSelectedRegister(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#D9D9D2]/70 bg-[#FAFAFA] text-sm text-[#3F3F3F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]/20 focus:border-[#3F3F3F] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {fetchingRegisters ? (
                  <option value="">Cargando cajas...</option>
                ) : !selectedBranch ? (
                  <option value="">Seleccione primero una sucursal...</option>
                ) : registers.length === 0 ? (
                  <option value="">No hay cajas en esta sucursal...</option>
                ) : (
                  <>
                    <option value="">Seleccione una caja...</option>
                    {registers.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            {/* Initial Amount Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#3F3F3F] uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-[#6B6B6B]" />
                <span>Monto Inicial de Apertura (S/.) *</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={openAmount}
                onKeyDown={handleNumericKeyDown}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (val < 0) return;
                  setOpenAmount(e.target.value);
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-[#D9D9D2]/70 bg-[#FAFAFA] text-sm text-[#3F3F3F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]/20 focus:border-[#3F3F3F] transition-all font-extrabold text-base"
                placeholder="0.00"
              />
            </div>

          </div>

          {/* Guidelines warning */}
          <div className="p-3.5 bg-amber-50/50 border border-amber-200/50 rounded-2xl flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span className="text-[10px] text-amber-800 font-semibold leading-relaxed">
              Al abrir caja, registras el efectivo inicial disponible para vuelto. Todas las ventas generadas se asociarán a esta sucursal y a tu usuario.
            </span>
          </div>

          {/* Action button */}
          <button
            type="submit"
            disabled={loading || !selectedBranch || !selectedRegister}
            className="w-full flex items-center justify-center gap-2 bg-[#3F3F3F] hover:bg-[#3F3F3F]/90 text-white py-3.5 rounded-2xl transition-all text-xs font-bold shadow-lg shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Iniciar Turno de Venta</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
};

export default OpenCashPage;
