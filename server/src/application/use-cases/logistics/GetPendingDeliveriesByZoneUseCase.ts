import { IDeliveryRepository } from '@domain/repositories/IDeliveryRepository';
import { IDeliveryZoneRepository } from '@domain/repositories/IDeliveryZoneRepository';
import { Delivery } from '@domain/entities/Delivery';
import { DeliveryZone } from '@domain/entities/DeliveryZone';

export interface DeliveriesByZoneGroup {
  zone: DeliveryZone | { id: 0; districts: string[]; deliveryCost: number; estimatedDays: number; name?: string };
  count: number;
  deliveries: Delivery[];
}

export class GetPendingDeliveriesByZoneUseCase {
  constructor(
    private readonly deliveryRepository: IDeliveryRepository,
    private readonly deliveryZoneRepository: IDeliveryZoneRepository
  ) {}

  async execute(): Promise<DeliveriesByZoneGroup[]> {
    // 1. Fetch pending deliveries
    const pendingDeliveries = await this.deliveryRepository.findDeliveries('PENDING');

    // 2. Fetch all zones
    const zones = await this.deliveryZoneRepository.findAll();

    // 3. Initialize groups map
    const groups = new Map<number, DeliveriesByZoneGroup>();
    
    // Create unassigned group
    const unassignedGroup: DeliveriesByZoneGroup = {
      zone: {
        id: 0,
        districts: [],
        deliveryCost: 0,
        estimatedDays: 0,
        name: 'Sin Zona Asignada',
      } as any,
      count: 0,
      deliveries: [],
    };

    zones.forEach((zone) => {
      groups.set(zone.id, {
        zone,
        count: 0,
        deliveries: [],
      });
    });

    // 4. Map deliveries to zones based on district
    for (const delivery of pendingDeliveries) {
      const addressSnapshot: any = (delivery as any).orderAddress;
      const district = addressSnapshot?.district?.trim()?.toLowerCase();

      let assignedZoneId: number | null = null;

      if (district) {
        // Find which zone contains this district
        for (const zone of zones) {
          const zoneDistricts = (zone.districts as string[] || []).map(d => d.trim().toLowerCase());
          if (zoneDistricts.includes(district)) {
            assignedZoneId = zone.id;
            break;
          }
        }
      }

      if (assignedZoneId && groups.has(assignedZoneId)) {
        const group = groups.get(assignedZoneId)!;
        group.deliveries.push(delivery);
        group.count += 1;
      } else {
        unassignedGroup.deliveries.push(delivery);
        unassignedGroup.count += 1;
      }
    }

    // 5. Convert to array and filter out empty groups
    const result = Array.from(groups.values()).filter(g => g.count > 0);
    
    if (unassignedGroup.count > 0) {
      result.push(unassignedGroup);
    }

    return result;
  }
}
