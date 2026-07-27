import { DeliveryZone } from '../entities/DeliveryZone';

export interface IDeliveryZoneRepository {
  findAll(): Promise<DeliveryZone[]>;
  findById(id: number): Promise<DeliveryZone | null>;
  findByDistrict(district: string): Promise<DeliveryZone | null>;
  create(data: Omit<DeliveryZone, 'id' | 'createdAt' | 'updatedAt'>): Promise<DeliveryZone>;
  update(id: number, data: Partial<Omit<DeliveryZone, 'id' | 'createdAt' | 'updatedAt'>>): Promise<DeliveryZone>;
  delete(id: number): Promise<void>;
}
