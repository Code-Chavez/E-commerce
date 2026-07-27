export interface Gender {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGenderDTO {
  name: string;
}

export interface UpdateGenderDTO {
  name?: string;
  isActive?: boolean;
}
