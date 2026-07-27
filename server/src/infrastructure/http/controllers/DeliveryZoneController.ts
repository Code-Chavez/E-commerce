import { Request, Response } from 'express';
import { CreateDeliveryZoneUseCase } from '../../../application/use-cases/delivery-zone/CreateDeliveryZoneUseCase';
import { UpdateDeliveryZoneUseCase } from '../../../application/use-cases/delivery-zone/UpdateDeliveryZoneUseCase';
import { DeleteDeliveryZoneUseCase } from '../../../application/use-cases/delivery-zone/DeleteDeliveryZoneUseCase';
import { GetDeliveryZonesUseCase } from '../../../application/use-cases/delivery-zone/GetDeliveryZonesUseCase';
import { GetDeliveryZoneByDistrictUseCase } from '../../../application/use-cases/delivery-zone/GetDeliveryZoneByDistrictUseCase';
import { GetSupportedLocationsUseCase } from '../../../application/use-cases/delivery-zone/GetSupportedLocationsUseCase';
import { PrismaDeliveryZoneRepository } from '../../database/repositories/PrismaDeliveryZoneRepository';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const repository = new PrismaDeliveryZoneRepository(prisma);

const createDeliveryZoneUseCase = new CreateDeliveryZoneUseCase(repository);
const updateDeliveryZoneUseCase = new UpdateDeliveryZoneUseCase(repository);
const deleteDeliveryZoneUseCase = new DeleteDeliveryZoneUseCase(repository);
const getDeliveryZonesUseCase = new GetDeliveryZonesUseCase(repository);
const getDeliveryZoneByDistrictUseCase = new GetDeliveryZoneByDistrictUseCase(repository);
const getSupportedLocationsUseCase = new GetSupportedLocationsUseCase(repository);

export class DeliveryZoneController {
  static async getSupportedLocations(req: Request, res: Response) {
    try {
      const locations = await getSupportedLocationsUseCase.execute();
      res.json(locations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  static async getAll(req: Request, res: Response) {
    try {
      const zones = await getDeliveryZonesUseCase.execute();
      res.json(zones);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getByDistrict(req: Request, res: Response) {
    try {
      const district = req.params.district as string;
      const zone = await getDeliveryZoneByDistrictUseCase.execute(district);
      if (!zone) {
        return res.status(404).json({ error: 'Zona no encontrada para este distrito' });
      }
      res.json(zone);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { districts, deliveryCost, estimatedDays } = req.body;
      const newZone = await createDeliveryZoneUseCase.execute({
        districts,
        deliveryCost,
        estimatedDays,
      });
      res.status(201).json(newZone);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const { districts, deliveryCost, estimatedDays } = req.body;
      const updatedZone = await updateDeliveryZoneUseCase.execute(id, {
        districts,
        deliveryCost,
        estimatedDays,
      });
      res.json(updatedZone);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      await deleteDeliveryZoneUseCase.execute(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
