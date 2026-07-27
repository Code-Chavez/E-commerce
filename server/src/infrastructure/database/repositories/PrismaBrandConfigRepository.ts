import { IBrandConfigRepository } from '@domain/repositories/IBrandConfigRepository';
import { BrandConfig } from '@domain/entities/BrandConfig';
import prisma from '@infrastructure/database/prisma';

export class PrismaBrandConfigRepository implements IBrandConfigRepository {
  async find(): Promise<BrandConfig | null> {
    const config = await prisma.brandConfig.findUnique({
      where: { id: 1 },
    });
    if (!config) return null;

    return {
      id: config.id,
      brandName: config.brandName,
      faviconUrl: config.faviconUrl,
      logoHorizontalUrl: config.logoHorizontalUrl,
      logoVerticalUrl: config.logoVerticalUrl,
      colorBrandBg: config.colorBrandBg,
      colorBrandPrimary: config.colorBrandPrimary,
      colorBrandText: config.colorBrandText,
      colorBrandAccent: config.colorBrandAccent,
      socialLinksJson: (config.socialLinksJson as Record<string, string>) || {},
      updatedAt: config.updatedAt,
    };
  }

  async upsert(data: {
    brandName: string;
    faviconUrl?: string | null;
    logoHorizontalUrl?: string | null;
    logoVerticalUrl?: string | null;
    colorBrandBg: string;
    colorBrandPrimary: string;
    colorBrandText: string;
    colorBrandAccent: string;
    socialLinksJson?: any;
  }): Promise<BrandConfig> {
    const config = await prisma.brandConfig.upsert({
      where: { id: 1 },
      update: {
        brandName: data.brandName,
        faviconUrl: data.faviconUrl,
        logoHorizontalUrl: data.logoHorizontalUrl,
        logoVerticalUrl: data.logoVerticalUrl,
        colorBrandBg: data.colorBrandBg,
        colorBrandPrimary: data.colorBrandPrimary,
        colorBrandText: data.colorBrandText,
        colorBrandAccent: data.colorBrandAccent,
        socialLinksJson: data.socialLinksJson || {},
      },
      create: {
        id: 1,
        brandName: data.brandName,
        faviconUrl: data.faviconUrl,
        logoHorizontalUrl: data.logoHorizontalUrl,
        logoVerticalUrl: data.logoVerticalUrl,
        colorBrandBg: data.colorBrandBg,
        colorBrandPrimary: data.colorBrandPrimary,
        colorBrandText: data.colorBrandText,
        colorBrandAccent: data.colorBrandAccent,
        socialLinksJson: data.socialLinksJson || {},
      },
    });

    return {
      id: config.id,
      brandName: config.brandName,
      faviconUrl: config.faviconUrl,
      logoHorizontalUrl: config.logoHorizontalUrl,
      logoVerticalUrl: config.logoVerticalUrl,
      colorBrandBg: config.colorBrandBg,
      colorBrandPrimary: config.colorBrandPrimary,
      colorBrandText: config.colorBrandText,
      colorBrandAccent: config.colorBrandAccent,
      socialLinksJson: (config.socialLinksJson as Record<string, string>) || {},
      updatedAt: config.updatedAt,
    };
  }
}
