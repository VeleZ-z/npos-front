import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/test-utils';
import OrderCard from '../orders/OrderCard';
import Auth from '../../pages/Auth';
import CustomerInfo from './CustomerInfo';
import CartInfo from './CartInfo';

vi.mock('../../https', () => ({}));

vi.mock('../auth/GoogleOneTap', () => ({
  default: () => <div data-testid="one-tap" />,
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual };
});

describe('OrderCard', () => {
  const base = {
    _id: 'o1',
    orderDate: new Date('2026-01-01T12:00:00'),
    customer: { name: 'Ana' },
    table: { number: 3 },
    items: [{ name: 'Pizza', quantity: 1 }],
    bills: { total: 25000 },
  };

  it('renderiza la tarjeta con datos del cliente y total', () => {
    renderWithProviders(<OrderCard order={{ ...base, orderStatus: 'PENDIENTE' }} />);
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('$25000')).toBeInTheDocument();
    expect(screen.getByText('1 Item')).toBeInTheDocument();
  });

  it('muestra estado LISTO', () => {
    renderWithProviders(<OrderCard order={{ ...base, orderStatus: 'LISTO' }} />);
    expect(screen.getByText('Listo')).toBeInTheDocument();
  });

  it('muestra estado ENTREGADO', () => {
    renderWithProviders(<OrderCard order={{ ...base, orderStatus: 'ENTREGADO' }} />);
    expect(screen.getByText('Entregado')).toBeInTheDocument();
  });

  it('muestra estado POR_APROBAR', () => {
    renderWithProviders(<OrderCard order={{ ...base, orderStatus: 'POR_APROBAR' }} />);
    expect(screen.getByText('POR_APROBAR')).toBeInTheDocument();
  });

  it('retorna null sin order', () => {
    const { container } = renderWithProviders(<OrderCard order={null} />);
    expect(container.firstChild).toBeNull();
  });
});

describe('Auth', () => {
  it('renderiza el título y el componente One Tap', () => {
    renderWithProviders(<Auth />);
    expect(screen.getByText(/Sign in with Google/i)).toBeInTheDocument();
    expect(screen.getByTestId('one-tap')).toBeInTheDocument();
  });
});

describe('CustomerInfo', () => {
  it('muestra nombre, orden y fallback genérico', () => {
    renderWithProviders(<CustomerInfo />, {
      initialState: { customer: { customerName: 'Ana', orderId: '7' } },
    });
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('#7 / Dine in')).toBeInTheDocument();
  });

  it('muestra fallback cuando no hay datos', () => {
    renderWithProviders(<CustomerInfo />, {
      initialState: { customer: {} },
    });
    expect(screen.getByText('Customer Name')).toBeInTheDocument();
    expect(screen.getByText('#N/A / Dine in')).toBeInTheDocument();
  });
});

describe('CartInfo', () => {
  beforeEach(() => {
    vi.spyOn(window, 'prompt').mockReturnValue('sin cebolla');
    Element.prototype.scrollTo = Element.prototype.scrollTo || vi.fn();
  });

  it('muestra carrito vacío', () => {
    renderWithProviders(<CartInfo />, { initialState: { cart: [] } });
    expect(screen.getByText(/Your cart is empty/i)).toBeInTheDocument();
  });

  it('muestra items y permite agregar nota', async () => {
    renderWithProviders(<CartInfo />, {
      initialState: {
        cart: [{ id: 'i1', name: 'Pizza', quantity: 2, price: 10000 }],
      },
    });
    expect(screen.getByText('Pizza')).toBeInTheDocument();
    expect(screen.getByText('x2')).toBeInTheDocument();
    const noteBtn = screen.getByTitle('Agregar nota');
    await userEvent.click(noteBtn);
    expect(window.prompt).toHaveBeenCalled();
  });
});