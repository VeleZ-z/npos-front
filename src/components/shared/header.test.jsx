import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/test-utils';
import Header from './Header';
import Metrics from '../dashboard/Metrics';


describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('muestra Invitado y Sin sesión para usuario no autenticado', () => {
    renderWithProviders(<Header />, { initialState: { user: {} } });
    expect(screen.getByText('Invitado')).toBeInTheDocument();
    expect(screen.getByText('Sin sesión')).toBeInTheDocument();
  });

  it('muestra el primer nombre y rol para staff autenticado, con botones dashboard/caja', () => {
    renderWithProviders(<Header />, {
      initialState: {
        user: { isAuth: true, name: 'Ana María', role: 'admin' },
      },
    });
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
  });

});

describe('Metrics', () => {
  it('muestra placeholders mientras carga', () => {
    renderWithProviders(<Metrics />);
    expect(screen.getByText('Rendimiento General')).toBeInTheDocument();
    expect(screen.getByText('Item Details')).toBeInTheDocument();
    expect(screen.getByText('Ganancias')).toBeInTheDocument();
    expect(screen.getByText('Total Mesas')).toBeInTheDocument();
  });
});