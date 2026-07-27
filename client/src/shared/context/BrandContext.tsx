import React, { createContext, useContext, useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';

export interface BrandConfig {
  id?: number;
  brandName: string;
  faviconUrl: string | null;
  logoHorizontalUrl: string | null;
  logoVerticalUrl: string | null;
  colorBrandBg: string;
  colorBrandPrimary: string;
  colorBrandText: string;
  colorBrandAccent: string;
  socialLinksJson: Record<string, string>;
  updatedAt?: string;
}

interface BrandContextType {
  brandConfig: BrandConfig | null;
  isLoadingBrand: boolean;
  refreshBrandConfig: () => Promise<void>;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export const BrandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [brandConfig, setBrandConfig] = useState<BrandConfig | null>(null);
  const [isLoadingBrand, setIsLoadingBrand] = useState(true);

  const fetchBrandConfig = async () => {
    try {
      const response = await axiosInstance.get('/v1/config/brand');
      if (response.data.success) {
        const config = response.data.data as BrandConfig;
        setBrandConfig(config);
        applyBrandStyles(config);
      }
    } catch (error) {
      console.error('Error fetching brand configuration:', error);
    } finally {
      setIsLoadingBrand(false);
    }
  };

  const applyBrandStyles = (config: BrandConfig) => {
    // Inject CSS variables
    const root = document.documentElement;
    root.style.setProperty('--color-brand-bg', config.colorBrandBg);
    root.style.setProperty('--color-brand-primary', config.colorBrandPrimary);
    root.style.setProperty('--color-brand-text', config.colorBrandText);
    root.style.setProperty('--color-brand-accent', config.colorBrandAccent);

    // Update Favicon
    if (config.faviconUrl) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = config.faviconUrl;
    }

    // Update Page Title
    if (config.brandName) {
      document.title = config.brandName;
    }
  };

  useEffect(() => {
    fetchBrandConfig();
  }, []);

  return (
    <BrandContext.Provider value={{ brandConfig, isLoadingBrand, refreshBrandConfig: fetchBrandConfig }}>
      {children}
    </BrandContext.Provider>
  );
};

export const useBrand = () => {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
};
