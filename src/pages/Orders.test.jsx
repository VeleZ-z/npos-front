import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Orders from './Orders';
import { renderWithProviders } from '../test/test-utils';

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
});