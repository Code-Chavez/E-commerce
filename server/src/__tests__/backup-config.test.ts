import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';

// ---- Hoisted Prisma mock ----
jest.mock('@infrastructure/database/prisma', () => ({
  __esModule: true,
  default: {
    backupConfig: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
  prisma: {
    backupConfig: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: { findUnique: jest.fn() },
  },
}));

// ---- Mock email service ----
jest.mock('@infrastructure/services/ResendEmailService', () => ({
  ResendEmailService: jest.fn().mockImplementation(() => ({
    sendEmail: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  })),
}));

import prisma from '@infrastructure/database/prisma';
import { AdminBackupConfigController } from '@infrastructure/http/controllers/admin/AdminBackupConfigController';

const DEFAULT_CONFIG = {
  id: 1,
  retentionDays: 7,
  adminEmail: 'admin@e-commerce.com',
  cronExpression: '0 0 * * *',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

function mockReq(overrides: Partial<Request> = {}): Partial<Request> {
  return {
    auth: { userId: 1, email: 'admin@e-commerce.com', role: 'ADMIN' } as any,
    body: {},
    headers: {},
    ...overrides,
  };
}

function mockRes(): {
  res: Partial<Response>;
  status: jest.Mock;
  json: jest.Mock;
} {
  const json = jest.fn<Response['json']>().mockReturnThis() as any;
  const status = jest
    .fn<Response['status']>()
    .mockReturnValue({ json } as any) as any;
  return { res: { status, json } as any, status, json };
}

describe('AdminBackupConfigController', () => {
  let controller: AdminBackupConfigController;

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.backupConfig.findFirst as any).mockResolvedValue(DEFAULT_CONFIG);
    (prisma.backupConfig.update as any).mockResolvedValue(DEFAULT_CONFIG);
    controller = new AdminBackupConfigController();
  });

  // ---------------------------------------------------------------
  // GET /api/v1/admin/backup-config
  // ---------------------------------------------------------------

  it('GET devuelve 200 con config cuando el rol es ADMIN', async () => {
    const req = mockReq();
    const { res, status, json } = mockRes();

    await controller.getConfig(req as Request, res as Response);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });

  it('GET devuelve 403 cuando el rol es CLIENT', async () => {
    const req = mockReq({
      auth: { userId: 2, email: 'client@test.com', role: 'CLIENT' } as any,
    });
    const { res, status, json } = mockRes();

    await controller.getConfig(req as Request, res as Response);

    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });

  it('GET devuelve 403 cuando no hay auth (sin token)', async () => {
    const req = mockReq({ auth: undefined });
    const { res, status } = mockRes();

    await controller.getConfig(req as Request, res as Response);

    expect(status).toHaveBeenCalledWith(403);
  });

  // ---------------------------------------------------------------
  // PUT /api/v1/admin/backup-config
  // ---------------------------------------------------------------

  it('PUT devuelve 200 con config actualizada cuando el body es válido', async () => {
    const updatedConfig = { ...DEFAULT_CONFIG, retentionDays: 14 };
    (prisma.backupConfig.update as any).mockResolvedValue(updatedConfig);

    const req = mockReq({ body: { retentionDays: 14 } });
    const { res, status, json } = mockRes();

    await controller.updateConfig(req as Request, res as Response);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });

  it('PUT devuelve 400 cuando retentionDays es 0', async () => {
    const req = mockReq({ body: { retentionDays: 0 } });
    const { res, status, json } = mockRes();

    await controller.updateConfig(req as Request, res as Response);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });
});
