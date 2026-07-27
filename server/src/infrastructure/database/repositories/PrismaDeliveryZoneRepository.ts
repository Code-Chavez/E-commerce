import { PrismaClient, Prisma } from '@prisma/client';
import { DeliveryZone } from '../../../domain/entities/DeliveryZone';
import { IDeliveryZoneRepository } from '../../../domain/repositories/IDeliveryZoneRepository';

export class PrismaDeliveryZoneRepository implements IDeliveryZoneRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private mapToEntity(record: any): DeliveryZone {
    return new DeliveryZone(
      record.id,
      record.districts as string[],
      Number(record.deliveryCost),
      record.estimatedDays,
      record.createdAt,
      record.updatedAt
    );
  }

  async findAll(): Promise<DeliveryZone[]> {
    const records = await this.prisma.deliveryZone.findMany({
      orderBy: { id: 'asc' }
    });
    return records.map(this.mapToEntity);
  }

  async findById(id: number): Promise<DeliveryZone | null> {
    const record = await this.prisma.deliveryZone.findUnique({ where: { id } });
    if (!record) return null;
    return this.mapToEntity(record);
  }

  async findByDistrict(district: string): Promise<DeliveryZone | null> {
    // MySQL JSON array search: JSON_CONTAINS(districts, '"Lima"')
    // Con Prisma se puede usar string-contains o raw query, pero como la lista de distritos es relativamente pequeña,
    // podemos traer todos y filtrar en memoria para evitar problemas de compatibilidad con diferentes bases de datos,
    // O mejor aún, buscar usando Raw en MySQL si Prisma JSON filters no funcionan bien para JSON arrays en MySQL.
    // Usaremos un filtro de string simple asumiendo que districts almacena un string stringificado de JSON.
    const records = await this.prisma.deliveryZone.findMany();
    
    const zone = records.find(record => {
      const dists = record.districts as string[];
      return dists.some(d => d.toLowerCase() === district.toLowerCase());
    });

    if (!zone) return null;
    return this.mapToEntity(zone);
  }

  async create(data: Omit<DeliveryZone, 'id' | 'createdAt' | 'updatedAt'>): Promise<DeliveryZone> {
    const record = await this.prisma.deliveryZone.create({
      data: {
        districts: data.districts,
        deliveryCost: data.deliveryCost,
        estimatedDays: data.estimatedDays,
      }
    });
    return this.mapToEntity(record);
  }

  async update(id: number, data: Partial<Omit<DeliveryZone, 'id' | 'createdAt' | 'updatedAt'>>): Promise<DeliveryZone> {
    const updateData: any = { ...data };
    if (updateData.deliveryCost !== undefined) {
      updateData.deliveryCost = new Prisma.Decimal(updateData.deliveryCost);
    }
    
    const record = await this.prisma.deliveryZone.update({
      where: { id },
      data: updateData
    });
    return this.mapToEntity(record);
  }

  async delete(id: number): Promise<void> {
    await this.prisma.deliveryZone.delete({ where: { id } });
  }
}
