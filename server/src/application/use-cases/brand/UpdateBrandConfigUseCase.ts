import { IBrandConfigRepository } from '@domain/repositories/IBrandConfigRepository';
import { IAuditLogRepository } from '@domain/repositories/IAuditLogRepository';
import { BrandConfig } from '@domain/entities/BrandConfig';

export interface UpdateBrandConfigDTO {
  brandName: string;
  faviconUrl?: string | null;
  logoHorizontalUrl?: string | null;
  logoVerticalUrl?: string | null;
  colorBrandBg: string;
  colorBrandPrimary: string;
  colorBrandText: string;
  colorBrandAccent: string;
  socialLinksJson?: any;
}

export class UpdateBrandConfigUseCase {
  constructor(
    private readonly brandConfigRepository: IBrandConfigRepository,
    private readonly auditLogRepository: IAuditLogRepository
  ) {}

  async execute(dto: UpdateBrandConfigDTO, adminUserId: number | null): Promise<BrandConfig> {
    const config = await this.brandConfigRepository.upsert(dto);

    // Dynamic clean log registration for traceability in audit logs (DoD align)
    await this.auditLogRepository.create({
      action: 'UPDATE_BRAND_CONFIG',
      module: 'SYSTEM_CONFIG',
      details: { config: JSON.parse(JSON.stringify(config)) },
      userId: adminUserId ?? undefined,
    });

    return config;
  }
}
