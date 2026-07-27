import { useState, useEffect, useCallback } from 'react';
import { orderService } from '../services/order.service';
import type { Order } from '../types';

export const useOrders = (initialLimit = 5) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await orderService.fetchUserOrders({
        status: statusFilter,
        page,
        limit,
      });
      setOrders(data.orders || []);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      setError(err.message || 'Error al obtener la lista de pedidos');
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, page, limit]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setPage(1); // Reiniciar a la primera página ante cambios de filtro
  };

  return {
    orders,
    isLoading,
    error,
    page,
    totalPages,
    total,
    statusFilter,
    setPage,
    setStatusFilter: handleStatusFilterChange,
    reloadOrders: loadOrders,
  };
};
