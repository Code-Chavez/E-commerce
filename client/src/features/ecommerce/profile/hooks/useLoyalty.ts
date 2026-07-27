import { useState, useCallback } from 'react';
import axiosInstance from '@/shared/api/axiosInstance';

export interface LoyaltyAccount {
  id: number;
  userId: number;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export const useLoyalty = () => {
  const [account, setAccount] = useState<LoyaltyAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get<{ success: boolean; data: LoyaltyAccount }>('/v1/loyalty/balance');
      if (response.data.success) {
        setAccount(response.data.data);
      } else {
        throw new Error('No se pudo cargar el saldo de puntos');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Error al cargar el saldo de puntos';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    account,
    isLoading,
    error,
    fetchBalance,
  };
};
