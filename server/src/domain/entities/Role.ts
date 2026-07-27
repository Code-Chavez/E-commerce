export interface Permission {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: number;
  name: string;
  description: string | null;
  permissions?: Permission[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRoleDTO {
  name: string;
  description?: string;
}
