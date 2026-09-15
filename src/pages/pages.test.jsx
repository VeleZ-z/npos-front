import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, makeStore } from '../test/test-utils';
import Menu from './Menu';
import Dashboard from './Dashboard';
import TableCard from '../components/tables/TableCard';

vi.mock('../components/menu/MenuContainer', () => ({
  default: () => <div data-testid="menu-container" />,
}));
vi.mock('../components/menu/CustomerInfo', () => ({
  default: () => <div data-testid="customer-info" />,
}));
vi.mock('../components/menu/CartInfo', () => ({
  default: () => <div data-testid="cart-info" />,
}));
vi.mock('../components/menu/Bill', () => ({
  default: () => <div data-testid="bill" />,
}));
vi.mock('../components/shared/BottomNav', () => ({
  default: () => <div data-testid="bottom-nav" />,
}));

vi.mock('../components/dashboard/Metrics', () => ({
  default: () => <div data-testid="metrics" />,
}));
vi.mock('../components/dashboard/RecentOrders', () => ({
  default: () => <div data-testid="recent-orders" />,
}));
vi.mock('../components/dashboard/Providers', () => ({
  default: () => <div data-testid="providers" />,
}));
vi.mock('../components/dashboard/Modal', () => ({
  default: () => <div data-testid="table-modal" />,
}));
vi.mock('../components/dashboard/CategoryModal', () => ({
  default: () => <div data-testid="category-modal" />,
}));
vi.mock('../components/home/MiniCard', () => ({
  default: ({ title }) => <div data-testid="mini-card">{title}</div>,
}));
vi.mock('../hooks/useTodayStats', () => ({
  default: () => ({ data: undefined, isLoading: false }),
}));

describe('Menu', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('muestra encabezado, sección de cliente genérico e hijos', () => {
    renderWithProviders(<Menu />);
    expect(screen.getByText('Selecciona tus productos')).toBeInTheDocument();
    expect(screen.getByText('Cliente')).toBeInTheDocument();
    expect(screen.getByText('Mesa: N/A')).toBeInTheDocument();
    expect(screen.getByTestId('menu-container')).toBeInTheDocument();
    expect(screen.getByTestId('customer-info')).toBeInTheDocument();
    expect(screen.getByTestId('cart-info')).toBeInTheDocument();
    expect(screen.getByTestId('bill')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-nav')).toBeInTheDocument();
  });

  it('muestra nombre del cliente y número de mesa del store', () => {
    renderWithProviders(<Menu />, {
      initialState: {
        customer: { customerName: 'Juan', table: { tableNo: 5 } },
      },
    });
    expect(screen.getByText('Juan')).toBeInTheDocument();
    expect(screen.getByText('Mesa: 5')).toBeInTheDocument();
  });
});

describe('Dashboard', () => {
  it('muestra los 3 botones de acción para admin', () => {
    renderWithProviders(<Dashboard />, {
      initialState: { user: { role: 'admin' } },
    });
    expect(screen.getByText('Añadir Mesa')).toBeInTheDocument();
    expect(screen.getByText('Categorias')).toBeInTheDocument();
    expect(screen.getByText('Compras')).toBeInTheDocument();
  });

  it('para staff solo muestra Compras', () => {
    renderWithProviders(<Dashboard />, {
      initialState: { user: { role: 'cashier' } },
    });
    expect(screen.queryByText('Añadir Mesa')).not.toBeInTheDocument();
    expect(screen.queryByText('Categorias')).not.toBeInTheDocument();
    expect(screen.getByText('Compras')).toBeInTheDocument();
  });

  it('sin rol no muestra botones de acción', () => {
    renderWithProviders(<Dashboard />, {
      initialState: { user: {} },
    });
    expect(screen.queryByText('Añadir Mesa')).not.toBeInTheDocument();
    expect(screen.queryByText('Compras')).not.toBeInTheDocument();
  });

  it('muestra Metrics por defecto y cambia a Proveedores al hacer click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Dashboard />, {
      initialState: { user: { role: 'admin' } },
    });
    expect(screen.getByTestId('metrics')).toBeInTheDocument();

    await user.click(screen.getByText('Proveedores'));
    expect(screen.getByTestId('providers')).toBeInTheDocument();
    expect(screen.queryByTestId('metrics')).not.toBeInTheDocument();
  });

  it('abre el modal de mesa al pulsar Añadir Mesa', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Dashboard />, {
      initialState: { user: { role: 'admin' } },
    });
    await user.click(screen.getByText('Añadir Mesa'));
    expect(screen.getByTestId('table-modal')).toBeInTheDocument();
  });

  it('tab Facturacion muestra las tarjetas de métricas', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Dashboard />, {
      initialState: { user: { role: 'admin' } },
    });
    await user.click(screen.getByText('Facturacion'));
    expect(screen.getAllByTestId('mini-card')).toHaveLength(2);
    expect(screen.getByText('Ganancias')).toBeInTheDocument();
  });
});

describe('TableCard', () => {
  it('muestra nombre, estado Ocupada y asientos', () => {
    renderWithProviders(
      <TableCard id="t1" name="7" status="Booked" initials="Ana" seats={4} />
    );
    expect(screen.getByText(/Table/)).toBeInTheDocument();
    expect(screen.getByText(/Table.*7/)).toBeInTheDocument();
    expect(screen.getByText('Ocupada')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('muestra Por aprobar para estado PendingApproval', () => {
    renderWithProviders(
      <TableCard id="t2" name="8" status="PendingApproval" initials="" seats={2} />
    );
    expect(screen.getByText('Por aprobar')).toBeInTheDocument();
  });

  it('mesa libre: al hacer click guarda la mesa seleccionada en el store', async () => {
    const user = userEvent.setup();
    const store = makeStore({ customer: {} });
    renderWithProviders(
      <TableCard id="t3" name="9" status="Available" initials="" seats={6} />,
      { store }
    );
    await user.click(screen.getByText(/Table.*9/));
    expect(store.getState().customer.table).toEqual({ tableId: 't3', tableNo: '9' });
  });

  it('mesa ocupada: no guarda la mesa al hacer click', async () => {
    const user = userEvent.setup();
    const store = makeStore({ customer: {} });
    renderWithProviders(<TableCard id="t4" name="10" status="Booked" initials="" seats={2} />, {
      store,
    });
    await user.click(screen.getByText(/Table.*10/));
    expect(store.getState().customer.table).toBeUndefined();
  });
});
