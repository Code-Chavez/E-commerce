import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  BulkLinkClientsUseCase,
  BulkLinkReport,
} from '@application/use-cases/admin/BulkLinkClientsUseCase';
import { LinkClientUseCase } from '@application/use-cases/admin/LinkClientUseCase';

// ---------------------------------------------------------------------------
// BulkLinkClientsUseCase tests (C-03)
// ---------------------------------------------------------------------------

describe('BulkLinkClientsUseCase (HU-008 — Bulk)', () => {
  let mockLinkClientUseCase: {
    execute: jest.MockedFunction<LinkClientUseCase['execute']>;
  };
  let bulkUseCase: BulkLinkClientsUseCase;

  beforeEach(() => {
    mockLinkClientUseCase = {
      execute: jest.fn<LinkClientUseCase['execute']>(),
    };
    // Cast to satisfy the constructor's type requirements
    bulkUseCase = new BulkLinkClientsUseCase(
      mockLinkClientUseCase as unknown as LinkClientUseCase
    );
    jest.clearAllMocks();
  });

  // ── Happy paths ──────────────────────────────────────────────────────────

  it('T-058: returns linked count equal to number of successful operations', async () => {
    mockLinkClientUseCase.execute.mockResolvedValue({
      success: true,
      message: 'Cliente vinculado y credenciales enviadas',
    });

    const report = await bulkUseCase.execute([1, 2, 3]);

    expect(report.linked).toBe(3);
    expect(report.skipped).toBe(0);
    expect(report.errors).toHaveLength(0);
    expect(mockLinkClientUseCase.execute).toHaveBeenCalledTimes(3);
  });

  it('returns empty report for an empty client IDs list', async () => {
    const report = await bulkUseCase.execute([]);

    expect(report.linked).toBe(0);
    expect(report.skipped).toBe(0);
    expect(report.errors).toHaveLength(0);
    expect(mockLinkClientUseCase.execute).not.toHaveBeenCalled();
  });

  // ── Skipping already-linked clients ─────────────────────────────────────

  it('increments skipped counter when client is already linked', async () => {
    mockLinkClientUseCase.execute
      .mockResolvedValueOnce({ success: true, message: 'ok' })
      .mockRejectedValueOnce(
        new Error('El cliente ya tiene una cuenta vinculada')
      )
      .mockResolvedValueOnce({ success: true, message: 'ok' });

    const report = await bulkUseCase.execute([1, 2, 3]);

    expect(report.linked).toBe(2);
    expect(report.skipped).toBe(1);
    expect(report.errors).toHaveLength(0);
  });

  // ── Error isolation ──────────────────────────────────────────────────────

  it('records unexpected errors per client without aborting the rest of the batch', async () => {
    mockLinkClientUseCase.execute
      .mockResolvedValueOnce({ success: true, message: 'ok' })
      .mockRejectedValueOnce(new Error('DB connection lost'))
      .mockResolvedValueOnce({ success: true, message: 'ok' });

    const report = await bulkUseCase.execute([10, 20, 30]);

    expect(report.linked).toBe(2);
    expect(report.skipped).toBe(0);
    expect(report.errors).toHaveLength(1);
    expect(report.errors[0]).toEqual({ id: 20, error: 'DB connection lost' });
  });

  it('handles mixed results: some linked, some skipped, some errored', async () => {
    mockLinkClientUseCase.execute
      .mockResolvedValueOnce({ success: true, message: 'ok' })
      .mockRejectedValueOnce(
        new Error('El cliente ya tiene una cuenta vinculada')
      )
      .mockRejectedValueOnce(new Error('Cliente no encontrado'))
      .mockResolvedValueOnce({ success: true, message: 'ok' });

    const report: BulkLinkReport = await bulkUseCase.execute([1, 2, 3, 4]);

    expect(report.linked).toBe(2);
    expect(report.skipped).toBe(1);
    expect(report.errors).toHaveLength(1);
    expect(report.errors[0].id).toBe(3);
    expect(report.errors[0].error).toBe('Cliente no encontrado');
  });

  // ── Batch processing ─────────────────────────────────────────────────────

  it('processes more than 10 clients across multiple batches', async () => {
    const ids = Array.from({ length: 25 }, (_, i) => i + 1);
    mockLinkClientUseCase.execute.mockResolvedValue({
      success: true,
      message: 'ok',
    });

    const report = await bulkUseCase.execute(ids);

    expect(report.linked).toBe(25);
    expect(report.skipped).toBe(0);
    expect(report.errors).toHaveLength(0);
    expect(mockLinkClientUseCase.execute).toHaveBeenCalledTimes(25);
  });

  it('correctly reports errors in the second batch (IDs 11+)', async () => {
    const ids = Array.from({ length: 15 }, (_, i) => i + 1);
    mockLinkClientUseCase.execute.mockImplementation(async (id: number) => {
      if (id === 13) throw new Error('Error in second batch');
      return { success: true, message: 'ok' };
    });

    const report = await bulkUseCase.execute(ids);

    expect(report.linked).toBe(14);
    expect(report.errors).toHaveLength(1);
    expect(report.errors[0]).toEqual({
      id: 13,
      error: 'Error in second batch',
    });
  });
});
