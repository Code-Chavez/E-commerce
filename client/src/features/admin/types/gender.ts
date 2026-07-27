export interface Gender {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGenderPayload {
  name: string;
}

export interface UpdateGenderPayload {
  name?: string;
  isActive?: boolean;
}
