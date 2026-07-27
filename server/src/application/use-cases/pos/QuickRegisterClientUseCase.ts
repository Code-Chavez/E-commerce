import prisma from '@infrastructure/database/prisma';
import { FactilizaService } from '@infrastructure/services/FactilizaService';

export interface QuickRegisterClientDTO {
  documentType: 'DNI' | 'RUC';
  documentId: string;
  phone?: string;
  email?: string;
  name?: string;
  branchId?: number;
}

export class QuickRegisterClientUseCase {
  private readonly factilizaService = new FactilizaService();

  async execute(dto: QuickRegisterClientDTO) {
    const { documentType, documentId, phone, email, name, branchId } = dto;

    // 1. Validar si ya existe en la BD
    const existing = await prisma.client.findUnique({
      where: { documentId },
    });

    if (existing) {
      const err = new Error(
        `El cliente con documento ${documentId} ya se encuentra registrado en el sistema`
      );
      (err as any).statusCode = 409;
      throw err;
    }

    // 2. Si no existe, validar con la API de Factiliza
    const apiResult = await this.factilizaService.lookupDocument(
      documentType,
      documentId
    );
    if (!apiResult || !apiResult.success) {
      const err = new Error(
        `Cliente no encontrado o documento inválido (${documentType}: ${documentId})`
      );
      (err as any).statusCode = 400;
      throw err;
    }

    // 3. Registrar con los datos obtenidos de la API
    const newClient = await prisma.client.create({
      data: {
        documentType: documentType,
        documentId: documentId,
        name: apiResult.name,
        lastName: apiResult.lastName || null,
        address: apiResult.address || null,
        department: apiResult.department || null,
        province: apiResult.province || null,
        district: apiResult.district || null,
        ubigeo: apiResult.ubigeo || null,
        phone: phone || null,
        email: email || null,
      },
    });

    return newClient;
  }
}
