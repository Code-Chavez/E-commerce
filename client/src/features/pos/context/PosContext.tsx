import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import axiosInstance from '@/shared/api/axiosInstance';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/shared/context/AuthContext';

interface CashRegister {
  id: number;
  branchId: number;
  name: string;
}

interface PosContextType {
  turnId: number | null;
  activeRegister: CashRegister | null;
  branchId: number | null;
  igvExempt: boolean;
  loading: boolean;
  isOpen: boolean;
  openShift: (registerId: number, openAmount: number, branchId: number, igvExempt: boolean) => Promise<void>;
  closeShiftLocal: () => void;
  checkActiveShift: () => Promise<boolean>;
}

const PosContext = createContext<PosContextType | null>(null);

export const PosProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [turnId, setTurnId] = useState<number | null>(null);
  const [activeRegister, setActiveRegister] = useState<CashRegister | null>(null);
  const [branchId, setBranchId] = useState<number | null>(null);
  const [igvExempt, setIgvExempt] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  const checkActiveShift = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return false;
    }
    try {
      const { data } = await axiosInstance.get('/v1/cash-turns/active');
      if (data.success && data.data) {
        setTurnId(data.data.id);
        setBranchId(data.data.branchId || null);
        setIgvExempt(data.data.igvExempt ?? false);

        if (data.data.registerId) {
          setActiveRegister({
            id: data.data.registerId,
            branchId: data.data.branchId || 0,
            name: `Caja #${data.data.registerId}`
          });
        }
        return true;
      } else {
        setTurnId(null);
        setActiveRegister(null);
        setBranchId(null);
        setIgvExempt(false);
        return false;
      }
    } catch {
      setTurnId(null);
      setActiveRegister(null);
      setBranchId(null);
      setIgvExempt(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    checkActiveShift();
  }, [checkActiveShift]);

  const openShift = async (registerId: number, openAmount: number, selectedBranchId: number, selectedIgvExempt: boolean) => {
    try {
      const { data } = await axiosInstance.post('/v1/cash-turns/open', {
        registerId,
        openAmount
      });
      if (data.success && data.data) {
        setTurnId(data.data.id);
        setBranchId(selectedBranchId);
        setIgvExempt(selectedIgvExempt);
        setActiveRegister({
          id: registerId,
          branchId: selectedBranchId,
          name: `Caja #${registerId}`
        });
        toast.success('Turno de caja abierto correctamente');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Error al abrir caja';
      toast.error(errorMsg);
      throw err;
    }
  };

  const closeShiftLocal = () => {
    setTurnId(null);
    setActiveRegister(null);
    setBranchId(null);
    setIgvExempt(false);
  };

  const isOpen = turnId !== null;

  return (
    <PosContext.Provider value={{
      turnId,
      activeRegister,
      branchId,
      igvExempt,
      loading,
      isOpen,
      openShift,
      closeShiftLocal,
      checkActiveShift
    }}>
      {children}
    </PosContext.Provider>
  );
};

export const usePos = (): PosContextType => {
  const context = useContext(PosContext);
  if (!context) {
    throw new Error('usePos must be used within a <PosProvider>');
  }
  return context;
};

export const PosGuard = ({ children }: { children: ReactNode }) => {
  const { isOpen, loading } = usePos();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-[#3F3F3F] border-t-[#D9D9D2] rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-[#3F3F3F] animate-pulse">Verificando sesión de caja...</span>
        </div>
      </div>
    );
  }

  if (!isOpen) {
    return <Navigate to="/pos/open-cash" replace />;
  }

  return <>{children}</>;
};

