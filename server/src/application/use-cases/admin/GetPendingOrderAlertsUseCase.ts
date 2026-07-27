import prisma from '@infrastructure/database/prisma';

export class GetPendingOrderAlertsUseCase {
  async execute() {
    // Get active alerts
    const alerts = await prisma.pendingOrderAlert.findMany({
      where: {
        isActive: true
      },
      include: {
        order: {
          select: {
            id: true,
            createdAt: true,
            total: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return {
      count: alerts.length,
      alerts
    };
  }
}
