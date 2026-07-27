export interface Client {
  id: number;
  email?: string | null;
  name: string;
  lastName?: string | null;
  phone?: string | null;
  documentType?: string | null;
  documentId?: string | null;
  address?: string | null;
  department?: string | null;
  province?: string | null;
  district?: string | null;
  ubigeo?: string | null;
  userId?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateClientDTO {
  email?: string | null;
  name: string;
  lastName?: string | null;
  phone?: string | null;
  documentType?: string | null;
  documentId?: string | null;
  address?: string | null;
  department?: string | null;
  province?: string | null;
  district?: string | null;
  ubigeo?: string | null;
}
