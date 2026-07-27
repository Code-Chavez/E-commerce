import prisma from '@infrastructure/database/prisma';

export interface RedeemLoyaltyPointsInput {
  userId: number;
  pointsToRedeem: number;
}

export class RedeemLoyaltyPointsUseCase {
  async execute(input: RedeemLoyaltyPointsInput): Promise<{ discountAmount: number; newBalance: number }> {
    const { userId, pointsToRedeem } = input;

    if (pointsToRedeem <= 0) {
      throw new Error('La cantidad de puntos a canjear debe ser mayor a 0');
    }

    // Usamos una transacción para asegurar la consistencia del balance
    return await prisma.$transaction(async (tx) => {
      const account = await tx.loyaltyAccount.findUnique({
        where: { userId },
      });

      if (!account || account.balance < pointsToRedeem) {
        throw new Error('Puntos insuficientes para realizar el canje');
      }

      // La regla de equivalencia en dinero para el descuento: 1 punto = 1 sol (asumido).
      // Se podría leer de LoyaltyConfig si en el futuro se hace dinámico.
      const discountAmount = pointsToRedeem; 

      // Descontar puntos
      const updatedAccount = await tx.loyaltyAccount.update({
        where: { userId },
        data: {
          balance: { decrement: pointsToRedeem },
        },
      });

      return {
        discountAmount,
        newBalance: updatedAccount.balance,
      };
    });
  }
}
