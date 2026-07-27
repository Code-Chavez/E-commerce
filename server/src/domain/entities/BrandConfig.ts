/**
 * Domain Entity: BrandConfig
 * Representa la configuración de identidad visual del sistema.
 */
export interface BrandConfig {
  id: number;
  brandName: string;
  faviconUrl: string | null;
  logoHorizontalUrl: string | null;
  logoVerticalUrl: string | null;
  colorBrandBg: string;
  colorBrandPrimary: string;
  colorBrandText: string;
  colorBrandAccent: string;
  socialLinksJson: Record<string, string>;
  updatedAt: Date;
}

/**
 * Valores por defecto para la identidad visual del sistema (Singleton Object).
 * Se utilizan cuando no existe una configuración personalizada en la base de datos.
 */
export const DEFAULT_BRAND_CONFIG: BrandConfig = {
  id: 1,
  brandName: "D'Mendoza",
  faviconUrl: null,
  logoHorizontalUrl: null,
  logoVerticalUrl: null,
  colorBrandBg: "#F7F7F5",
  colorBrandPrimary: "#D9D9D2",
  colorBrandText: "#6B6B6B",
  colorBrandAccent: "#3F3F3F",
  socialLinksJson: {},
  updatedAt: new Date(),
};
