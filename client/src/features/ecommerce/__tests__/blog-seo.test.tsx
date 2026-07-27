import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import BlogPostPage from '../BlogPostPage';

const mockAxiosGet = vi.fn();
vi.mock('@/shared/api/axiosInstance', () => ({
  default: {
    get: (...args: any[]) => mockAxiosGet(...args)
  },
}));

describe('HU-018: Inyección de Etiquetas SEO (RF-33)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Debe inyectar los tags en el DOM a través de react-helmet-async', async () => {
    mockAxiosGet.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          id: 1,
          title: 'SEO Test Blog',
          slug: 'seo-test-blog',
          content: '<p>Content</p>',
          metaTitle: 'SEO Meta Title',
          metaDescription: 'SEO Meta Desc',
          status: 'PUBLISHED',
          createdAt: '2026-01-01T12:00:00.000Z',
          tags: ['ecommerce', 'marketing']
        }
      }
    });

    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={['/blog/seo-test-blog']}>
          <Routes>
            <Route path="/blog/:slug" element={<BlogPostPage />} />
          </Routes>
        </MemoryRouter>
      </HelmetProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('SEO Test Blog')).toBeInTheDocument();
    });

    // Validamos que los tags de artículo existan en el Document Head
    // Helmet maneja el inyectado al head principal
    await waitFor(() => {
      const tagMetas = document.querySelectorAll('meta[property="article:tag"]');
      expect(tagMetas.length).toBeGreaterThan(0);
      
      const contents = Array.from(tagMetas).map(m => m.getAttribute('content'));
      expect(contents).toContain('ecommerce');
      expect(contents).toContain('marketing');
    });
  });
});
