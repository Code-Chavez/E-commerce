import axiosInstance from '@/shared/api/axiosInstance';

export type ComplaintCategory = 'PRODUCTO' | 'SERVICIO' | 'ENTREGA' | 'ATENCION' | 'PAGO' | 'OTRO';
export type ComplaintStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED';

export interface Complaint {
  id: number;
  userId: number;
  orderId: number | null;
  category: ComplaintCategory;
  description: string;
  status: ComplaintStatus;
  createdAt: string;
  updatedAt: string;
  order?: { id: number; createdAt: string } | null;
  user?: { id: number; name: string | null; lastName: string | null; email: string };
}

export interface CreateComplaintInput {
  orderId?: number;
  category: ComplaintCategory;
  description: string;
}

export const complaintService = {
  async create(input: CreateComplaintInput): Promise<Complaint> {
    const { data } = await axiosInstance.post('/v1/complaints', input);
    if (!data.success) throw new Error(data.error || 'No se pudo crear la reclamación');
    return data.data;
  },

  async getMine(): Promise<Complaint[]> {
    const { data } = await axiosInstance.get('/v1/complaints/my');
    if (!data.success) throw new Error(data.error || 'Error al obtener reclamaciones');
    return data.data;
  },

  async getAll(status?: ComplaintStatus): Promise<Complaint[]> {
    const params = status ? { status } : {};
    const { data } = await axiosInstance.get('/v1/admin/complaints', { params });
    if (!data.success) throw new Error(data.error || 'Error al obtener reclamaciones');
    return data.data;
  },

  async updateStatus(id: number, status: ComplaintStatus): Promise<Complaint> {
    const { data } = await axiosInstance.patch(`/v1/admin/complaints/${id}/status`, { status });
    if (!data.success) throw new Error(data.error || 'Error al actualizar estado');
    return data.data;
  },
};
