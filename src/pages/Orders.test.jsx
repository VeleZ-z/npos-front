import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Orders from './Orders';
import { renderWithProviders } from '../test/test-utils';
import { enqueueSnackbar } from 'notistack';
import { getOrders } from '../https/index';

vi.mock('../components/shared/BottomNav', () => ({
  default: () => <div data-testid="bottom-nav" />,
}));
vi.mock('../components/shared/BackButton', () => ({
  default: () => <button type="button">back</button>,
}));
vi.mock('../components/orders/OrderCard', () => ({
  default: ({ order }) => <div data-testid="order-card">{order._id}</div>,
}));
vi.mock('notistack', () => ({
  enqueueSnackbar: vi.fn(),
}));

const fixtures = vi.hoisted(() => {
  const now = Date.now();
  const isoAgo = (days) => new Date(now - days * 86400000).toISOString();
  return [
    { _id: 'o1', orderStatus: 'PENDIENTE', orderDate: isoAgo(0), items: [{ _id: 'i1' }] },
    { _id: 'o2', orderStatus: 'LISTO', orderDate: isoAgo(40), items: [{ _id: 'i2' }] },
    { _id: 'o3', orderStatus: 'PAGADO', orderDate: isoAgo(0), items: [{ _id: 'i3' }] },
    { _id: 'o4', orderStatus: 'ENTREGADO', orderDate: isoAgo(0), items: [] },
  ];
});

vi.mock('../https/index', () => ({
  getOrders: vi.fn().mockResolvedValue({ data: { data: fixtures } }),
}));

const authStaff = {
  user: { _id: '1', name: 'Ana', email: 'a@b.c', phone: '', role: 'Admin', isAuth: true },
};

describe('Orders (flujo de comandas)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza las órdenes con items', async () => {
    renderWithProviders(<Orders />, { initialState: authStaff });
    await waitFor(() =>
      expect(screen.getAllByTestId('order-card').length).toBeGreaterThan(0)
    );
  });

  it('excluye órdenes sin items', async () => {
    renderWithProviders(<Orders />, { initialState: authStaff });
    await waitFor(() => {
      const cards = screen.getAllByTestId('order-card');
      expect(cards.map((c) => c.textContent)).not.toContain('o4');
    });
  });

  it('excluye órdenes fuera del rango de 30 días por defecto', async () => {
    renderWithProviders(<Orders />, { initialState: authStaff });
    await waitFor(() => {
      const cards = screen.getAllByTestId('order-card');
      expect(cards.map((c) => c.textContent)).not.toContain('o2');
    });
  });

  it('filtra por estado "completadas" (ENTREGADO/PAGADO)', async () => {
    renderWithProviders(<Orders />, { initialState: authStaff });
    await waitFor(() =>
      expect(screen.getAllByTestId('order-card').length).toBeGreaterThan(0)
    );
    await userEvent.click(screen.getByText('Completadas'));
    await waitFor(() => {
      const cards = screen.getAllByTestId('order-card');
      const ids = cards.map((c) => c.textContent);
      expect(ids).toContain('o3');
      expect(ids).not.toContain('o1');
      expect(ids).not.toContain('o2');
    });
  });

  it('filtra por estado "en proceso"', async () => {
    renderWithProviders(<Orders />, { initialState: authStaff });
    await waitFor(() =>
      expect(screen.getAllByTestId('order-card').length).toBeGreaterThan(0)
    );
    await userEvent.click(screen.getByText('En proceso'));
    await waitFor(() => {
      const ids = screen
        .getAllByTestId('order-card')
        .map((c) => c.textContent);
      expect(ids).toContain('o1');
      expect(ids).not.toContain('o3');
    });
  });

  it('filtra por estado "listas"', async () => {
    const now = Date.now();
    getOrders.mockResolvedValue({
      data: {
        data: [
          { _id: 'o1', orderStatus: 'PENDIENTE', orderDate: new Date(now).toISOString(), items: [{}] },
          { _id: 'o2', orderStatus: 'LISTO', orderDate: new Date(now).toISOString(), items: [{}] },
        ],
      },
    });
    renderWithProviders(<Orders />, { initialState: authStaff });
    await waitFor(() =>
      expect(screen.getAllByTestId('order-card').length).toBeGreaterThan(0)
    );
    await userEvent.click(screen.getByRole('button', { name: 'Listas' }));
    await waitFor(() => {
      const ids = screen
        .getAllByTestId('order-card')
        .map((c) => c.textContent);
      expect(ids).toContain('o2');
      expect(ids).not.toContain('o1');
    });
  });

  it('muestra inputs de fecha en rango personalizado y filtra', async () => {
    getOrders.mockResolvedValue({
      data: {
        data: [
          { _id: 'o1', orderStatus: 'PENDIENTE', orderDate: new Date().toISOString(), items: [{}] },
          { _id: 'o2', orderStatus: 'LISTO', orderDate: new Date(Date.now() - 40 * 86400000).toISOString(), items: [{}] },
        ],
      },
    });
    renderWithProviders(<Orders />, { initialState: authStaff });
    await waitFor(() =>
      expect(screen.getAllByTestId('order-card').length).toBeGreaterThan(0)
    );
    await userEvent.click(screen.getByText('Personalizado'));
    const dateInputs = document.querySelectorAll('input[type="date"]');
    expect(dateInputs.length).toBe(2);
    // hasta = ayer → o1 (hoy) queda fuera
    const yesterday = new Date(Date.now() - 86400000);
    const iso = yesterday.toISOString().slice(0, 10);
    fireEvent.change(dateInputs[1], { target: { value: iso } });
    // o2 (40 días atrás) sigue dentro del rango "hasta ayer"; o1 (hoy) queda fuera
    await waitFor(() => {
      const ids = screen
        .getAllByTestId('order-card')
        .map((c) => c.textContent);
      expect(ids).toContain('o2');
      expect(ids).not.toContain('o1');
    });
  });

  it('muestra estado vacío sin autenticación (query deshabilitada)', async () => {
    renderWithProviders(<Orders />, { initialState: { user: { isAuth: false } } });
    await waitFor(() =>
      expect(screen.getByText('No orders available')).toBeInTheDocument()
    );
    expect(getOrders).not.toHaveBeenCalled();
  });

  it('muestra snackbar al fallar la carga', async () => {
    getOrders.mockRejectedValue(new Error('network down'));
    renderWithProviders(<Orders />, { initialState: authStaff });
    await waitFor(() =>
      expect(enqueueSnackbar).toHaveBeenCalledWith('Something went wrong!', {
        variant: 'error',
      })
    );
    expect(screen.getByText('No orders available')).toBeInTheDocument();
  });

  it('excluye órdenes con fecha inválida', async () => {
    getOrders.mockResolvedValue({
      data: { data: [{ _id: 'oX', orderStatus: 'PENDIENTE', orderDate: 'fecha-inválida', items: [{}] }] },
    });
    renderWithProviders(<Orders />, { initialState: authStaff });
    await waitFor(() =>
      expect(screen.getByText('No orders available')).toBeInTheDocument()
    );
  });
});