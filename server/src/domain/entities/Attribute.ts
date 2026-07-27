export interface AttributeValue {
  id: number;
  value: string;
  isActive: boolean;
  attributeId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attribute {
  id: number;
  name: string;
  isVisualDriver: boolean;
  isActive: boolean;
  values?: AttributeValue[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAttributeDTO { name: string; isVisualDriver?: boolean; }
export interface CreateAttributeValueDTO { value: string; attributeId: number; }
