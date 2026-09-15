import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/test-utils';
import Greetings from './Greetings';
import CustomerGreeting from './CustomerGreeting';
import MiniCard from './MiniCard';
import AlertsBell from '../shared/AlertsBell';

vi.mock('../../https', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getMyAlerts: vi.fn(),
    ackMyAlert: vi.fn(),
  };
});
import { getMyAlerts, ackMyAlert } from '../../https';

vi.mock('../../context/LoginModalContext', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useLoginModal: () => ({ openLoginModal: vi.fn() }),
  };
});

describe('Greetings', () => {
  it('saluda al usuario con nombre y al cliente genérico sin nombre', () => {
    const { rerender } = renderWithProviders(<Greetings />, {
      initialState: { user: { name: 'Ana' } },
    });
    expect(screen.getByText(/Ana/)).toBeInTheDocument();

    rerender(
      <Greetings />
    );
  });

  it('muestra Hola Cliente Nativhos cuando no hay nombre', () => {
    renderWithProviders(<Greetings />, {
      initialState: { user: { name: '' } },
    });
    expect(screen.getByText(/Cliente Nativhos/)).toBeInTheDocument();
  });
});

describe('CustomerGreeting', () => {
  it('saluda al cliente por su nombre', () => {
    renderWithProviders(<CustomerGreeting />, {
      initialState: { user: { name: 'Luis' } },
    });
    expect(screen.getByText(/Luis/)).toBeInTheDocument();
  });

  it('saluda Cliente genérico cuando no hay nombre', () => {
    renderWithProviders(<CustomerGreeting />, {
      initialState: { user: { name: '' } },
    });
    expect(screen.getByText(/Cliente/)).toBeInTheDocument();
  });
});

describe('MiniCard', () => {
  it('formatea número sin moneda', () => {
    renderWithProviders(<MiniCard title="Ventas" icon={<span>i</span>} number={1234} />);
    expect(screen.getByText('1.234')).toBeInTheDocument();
  });

  it('formatea número con moneda y signo positivo', () => {
    renderWithProviders(
      <MiniCard title="Ingresos" icon={<span>i</span>} number={500} isCurrency change={5.5} />
    );
    expect(screen.getByText('$ 500')).toBeInTheDocument();
    expect(screen.getByText(/\+5\.5%/)).toBeInTheDocument();
  });

  it('muestra placeholder cuando está cargando', () => {
    renderWithProviders(<MiniCard title="Ventas" icon={<span>i</span>} isLoading />);
    expect(screen.getAllByText('...').length).toBeGreaterThan(0);
  });

  it('muestra cambio negativo en rojo', () => {
    renderWithProviders(
      <MiniCard title="Ventas" icon={<span>i</span>} number={100} change={-2.5} />
    );
    expect(screen.getByText(/-2\.5%/)).toBeInTheDocument();
  });
});

describe('AlertsBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('abre el modal y muestra Sin alertas cuando no hay', async () => {
    getMyAlerts.mockResolvedValue({ data: { data: [] } });
    renderWithProviders(<AlertsBell />, {
      initialState: { user: { isAuth: true } },
    });
    await userEvent.click(screen.getByRole('button'));
    expect(await screen.findByText('Sin alertas')).toBeInTheDocument();
  });

  it('muestra las alertas y permite marcarlas como leídas', async () => {
    getMyAlerts.mockResolvedValue({
      data: {
        data: [
          { id: 'a1', message: 'Stock bajo', purchaseId: 'p1' },
          { id: 'a2', message: 'Compra recibida' },
        ],
      },
    });
    ackMyAlert.mockResolvedValue({ data: { ok: true } });
    renderWithProviders(<AlertsBell />, {
      initialState: { user: { isAuth: true } },
    });
    await userEvent.click(screen.getByRole('button'));
    expect(await screen.findByText('Stock bajo')).toBeInTheDocument();
    expect(screen.getByText('Compra recibida')).toBeInTheDocument();
    expect(screen.getByText('Compra #p1')).toBeInTheDocument();
    const ackBtn = screen.getAllByText('Marcar leída')[0];
    await userEvent.click(ackBtn);
    expect(ackMyAlert).toHaveBeenCalledWith('a1');
  });
});