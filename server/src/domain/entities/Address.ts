export interface Address {
  id: number;
  userId: number;
  alias: string;
  fullAddress: string;
  district: string;
  reference: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAddressDTO {
  alias: string;
  fullAddress: string;
  district: string;
  reference?: string | null;
  isDefault?: boolean;
}

export interface UpdateAddressDTO {
  alias?: string;
  fullAddress?: string;
  district?: string;
  reference?: string | null;
  isDefault?: boolean;
}
