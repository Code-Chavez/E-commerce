import { IDeliveryZoneRepository } from '../../../domain/repositories/IDeliveryZoneRepository';

export interface SupportedLocationsResponse {
  departments: {
    name: string;
    provinces: {
      name: string;
      districts: {
        name: string;
        cost: number;
        estimatedDays: number;
      }[];
    }[];
  }[];
}

export class GetSupportedLocationsUseCase {
  constructor(private readonly deliveryZoneRepository: IDeliveryZoneRepository) {}

  async execute(): Promise<SupportedLocationsResponse> {
    const zones = await this.deliveryZoneRepository.findAll();
    
    // We need to parse "Departamento|Provincia|Distrito" and group them
    const departmentMap = new Map<string, Map<string, any[]>>();

    for (const zone of zones) {
      for (const districtStr of zone.districts) {
        const parts = districtStr.split('|');
        // Handle gracefully if some strings don't match the format
        if (parts.length >= 3) {
          const dept = parts[0].trim();
          const prov = parts[1].trim();
          const dist = parts.slice(2).join('|').trim();

          if (!departmentMap.has(dept)) {
            departmentMap.set(dept, new Map());
          }
          const provMap = departmentMap.get(dept)!;
          
          if (!provMap.has(prov)) {
            provMap.set(prov, []);
          }
          
          provMap.get(prov)!.push({
            name: dist,
            cost: zone.deliveryCost,
            estimatedDays: zone.estimatedDays
          });
        } else if (parts.length === 1) {
          // Fallback gracefully
          const dept = "Otros";
          const prov = "Otros";
          const dist = parts[0].trim();
          
          if (!departmentMap.has(dept)) departmentMap.set(dept, new Map());
          const provMap = departmentMap.get(dept)!;
          if (!provMap.has(prov)) provMap.set(prov, []);
          
          provMap.get(prov)!.push({
            name: dist,
            cost: zone.deliveryCost,
            estimatedDays: zone.estimatedDays
          });
        }
      }
    }

    const response: SupportedLocationsResponse = { departments: [] };

    for (const [deptName, provMap] of departmentMap.entries()) {
      const provinces = [];
      for (const [provName, districts] of provMap.entries()) {
        provinces.push({
          name: provName,
          districts: districts.sort((a, b) => a.name.localeCompare(b.name))
        });
      }
      provinces.sort((a, b) => a.name.localeCompare(b.name));
      response.departments.push({
        name: deptName,
        provinces
      });
    }

    response.departments.sort((a, b) => a.name.localeCompare(b.name));
    return response;
  }
}
