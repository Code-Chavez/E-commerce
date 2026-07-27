export interface ClientAdminResponseDto {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface UnifiedClientsPagedResponse {
  clients: ClientAdminResponseDto[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  };
}
