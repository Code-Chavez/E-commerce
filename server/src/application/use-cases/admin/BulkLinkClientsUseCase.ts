import { LinkClientUseCase } from './LinkClientUseCase';

export interface BulkLinkReport {
  linked: number;
  skipped: number;
  errors: { id: number; error: string }[];
}

export class BulkLinkClientsUseCase {
  constructor(private readonly linkClientUseCase: LinkClientUseCase) {}

  async execute(
    clientIds: number[],
    emails?: Record<number, string>
  ): Promise<BulkLinkReport> {
    const report: BulkLinkReport = {
      linked: 0,
      skipped: 0,
      errors: [],
    };

    const BATCH_SIZE = 10;
    for (let i = 0; i < clientIds.length; i += BATCH_SIZE) {
      const batch = clientIds.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((id) => this.linkClientUseCase.execute(id, emails?.[id]))
      );

      results.forEach((result, index) => {
        const clientId = batch[index];
        if (result.status === 'fulfilled') {
          report.linked++;
        } else {
          const error = result.reason as Error;
          if (error.message === 'El cliente ya tiene una cuenta vinculada') {
            report.skipped++;
          } else {
            report.errors.push({ id: clientId, error: error.message });
          }
        }
      });
    }

    return report;
  }
}
