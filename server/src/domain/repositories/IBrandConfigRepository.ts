import { BrandConfig } from '@domain/entities/BrandConfig';

export interface IBrandConfigRepository {
  find(): Promise<BrandConfig | null>;
  upsert(data: {
    brandName: string;
    faviconUrl?: string | null;
    logoHorizontalUrl?: string | null;
    logoVerticalUrl?: string | null;
    colorBrandBg: string;
    colorBrandPrimary: string;
    colorBrandText: string;
    colorBrandAccent: string;
    socialLinksJson?: any;
  }): Promise<BrandConfig>;
}
