import prisma from '@infrastructure/database/prisma';

export interface UpdateLoyaltyConfigInput {
  solesPerPoint: number;
}

export class UpdateLoyaltyConfigUseCase {
  async execute(input: UpdateLoyaltyConfigInput) {
    if (!input.solesPerPoint || input.solesPerPoint <= 0) {
      throw new Error('La cantidad de soles por punto debe ser mayor a 0');
    }

    let config = await prisma.loyaltyConfig.findFirst();

    if (!config) {
      config = await prisma.loyaltyConfig.create({
        data: {
          solesPerPoint: input.solesPerPoint,
          isActive: true,
        },
      });
    } else {
      config = await prisma.loyaltyConfig.update({
        where: { id: config.id },
        data: {
          solesPerPoint: input.solesPerPoint,
        },
      });
    }

    return config;
  }
}
