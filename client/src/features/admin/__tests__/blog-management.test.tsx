import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import BlogEditorPage from '../BlogEditorPage';
import BlogAdminPage from '../BlogAdminPage';

// Mocks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '1' }),
  };
});

const mockAxiosGet = vi.fn();
const mockAxiosPost = vi.fn();
const mockAxiosPatch = vi.fn();
const mockAxiosDelete = vi.fn();

vi.mock('@/shared/api/axiosInstance', () => ({
  default: {
    get: (...args: any[]) => mockAxiosGet(...args),
    post: (...args: any[]) => mockAxiosPost(...args),
    patch: (...args: any[]) => mockAxiosPatch(...args),
    delete: (...args: any[]) => mockAxiosDelete(...args),
  },
}));

// Mock TipTap to avoid complexity
vi.mock('@tiptap/react', () => ({
  useEditor: () => ({
    getHTML: () => '<p>Contenido de prueba</p>',
    commands: { setContent: vi.fn() }
  }),
  EditorContent: () => <div data-testid="tiptap-editor" />
}));

describe('HU-018: Creación y publicación de artículos de blog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('RF-32 & RF-33: Editor con Programación y Etiquetas', () => {
    it('1. Debe cargar y enviar correctamente publishedAt y tags', async () => {
      mockAxiosGet.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            id: 1,
            title: 'Test Blog',
            slug: 'test-blog',
            content: '<p>Content</p>',
            status: 'DRAFT',
            publishedAt: '2027-01-01T12:00:00.000Z',
            tags: ['seo', 'tech'],
          }
        }
      });

      mockAxiosPatch.mockResolvedValueOnce({ data: { success: true } });

      render(
        <MemoryRouter initialEntries={['/admin/blog/1/edit']}>
          <Toaster />
          <Routes>
            <Route path="/admin/blog/:id/edit" element={<BlogEditorPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Esperar a que cargue
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Blog')).toBeInTheDocument();
      });

      // Verificar que los tags se formatearon en el input
      expect(screen.getByDisplayValue('seo, tech')).toBeInTheDocument();
      
      // Cambiar las etiquetas
      const tagsInput = screen.getByLabelText(/Etiquetas SEO/i);
      fireEvent.change(tagsInput, { target: { value: 'seo, tech, news' } });

      // Guardar
      const saveBtn = screen.getByRole('button', { name: /Borrador/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(mockAxiosPatch).toHaveBeenCalledWith(
          '/v1/admin/blog/1',
          expect.objectContaining({
            publishedAt: expect.stringContaining('2027-01-01'), // Mantiene la fecha
            tags: ['seo', 'tech', 'news'] // Parsea correctamente
          })
        );
      });
    });
  });

  describe('RF-30: Borrado a Inactivación Lógica', () => {
    it('2. Debe mostrar botón Archivar e invocar delete que actúa como borrado lógico', async () => {
      mockAxiosGet.mockResolvedValueOnce({
        data: {
          success: true,
          data: [{
            id: 1,
            title: 'Test Blog',
            slug: 'test-blog',
            status: 'PUBLISHED',
            createdAt: '2026-01-01T12:00:00.000Z'
          }]
        }
      });

      mockAxiosDelete.mockResolvedValueOnce({ data: { success: true } });

      // Mock window.confirm
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(
        <MemoryRouter initialEntries={['/admin/blog']}>
          <Toaster />
          <Routes>
            <Route path="/admin/blog" element={<BlogAdminPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Esperar a que cargue la lista
      await waitFor(() => {
        expect(screen.getByText('Test Blog')).toBeInTheDocument();
      });

      // Buscar el botón de archivar por título
      const archiveBtn = screen.getByTitle('Archivar');
      expect(archiveBtn).toBeInTheDocument();

      fireEvent.click(archiveBtn);

      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalledWith('¿Está seguro de que desea archivar este artículo?');
        expect(mockAxiosDelete).toHaveBeenCalledWith('/v1/admin/blog/1');
      });
    });
  });
});
