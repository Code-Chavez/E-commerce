import { useEffect } from 'react';

export const useDocumentTitle = (title: string) => {
  useEffect(() => {
    const defaultTitle = 'E-Commerce Platform'; // Fallback base name
    document.title = `${title} | ${defaultTitle}`;
    
    // Optional Cleanup to restore default if unmounted
    return () => {
      document.title = defaultTitle;
    };
  }, [title]);
};
