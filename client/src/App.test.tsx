import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

describe('App Component', () => {
  it('renders correctly and shows registration title', () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <App />
      </MemoryRouter>
    );
    const heading = screen.getByText(/Crea tu cuenta/i);
    expect(heading).toBeInTheDocument();
  });
});
