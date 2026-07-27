import prisma from '@infrastructure/database/prisma';

export class GetLoyaltyConfigUseCase {
  async execute() {
    let config = await prisma.loyaltyConfig.findFirst();

    if (!config) {
      config = await prisma.loyaltyConfig.create({
        data: {
          solesPerPoint: 100.0,
          isActive: true,
        },
      });
    }

    return config;
  }
}
