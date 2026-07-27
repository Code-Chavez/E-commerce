/**
 * Representa un cliente unificado del sistema (POS, E-commerce o Ambos).
 */
export interface Client {
  id: number;
  email: string | null;
  name: string;
  lastName: string | null;
  phone: string | null;
  documentType: string | null;
  documentId: string | null;
  address: string | null;
  department: string | null;
  province: string | null;
  district: string | null;
  ubigeo: string | null;
  userId: number | null;
  isActive: boolean;
  type: 'POS' | 'ECOMMERCE' | 'AMBOS';
  createdAt: string;
  updatedAt: string;
}

export interface UnifiedClientsPagedResponse {
  clients: Client[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  };
}
