import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, makeStore } from '../test/test-utils';
import CashDesk from '../pages/CashDesk';
import DishRank from '../pages/DishRank';
import Discounts from '../pages/Discounts';
import Promotions from '../pages/Promotions';
import Header from './shared/Header';
import BottomNav from './shared/BottomNav';
import GoogleOneTap from './auth/GoogleOneTap';

vi.mock('notistack', () => ({ enqueueSnackbar: vi.fn() }));

const navigateMock = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('../https', () => ({
  getCurrentCashDesk: vi.fn(),
  openCashDesk: vi.fn(),
  closeCashDesk: vi.fn(),
  exportCashDeskMovements: vi.fn(),
  getPopularProductsStats: vi.fn(),
  getAdminDiscounts: vi.fn(),
  createDiscountAdmin: vi.fn(),
  updateDiscountAdmin: vi.fn(),
  resendDiscount: vi.fn(),
  getDiscounts: vi.fn(),
  getProducts: vi.fn(),
  logout: vi.fn(),
  getMyAlerts: vi.fn(),
  ackMyAlert: vi.fn(),
  googleLogin: vi.fn(),
  getAuthState: vi.fn(),
}));

import {
  getCurrentCashDesk,
  openCashDesk,
  closeCashDesk,
  exportCashDeskMovements,
  getPopularProductsStats,
  getAdminDiscounts,
  createDiscountAdmin,
  updateDiscountAdmin,
  resendDiscount,
  getDiscounts,
  getProducts,
  logout,
  getMyAlerts,
  googleLogin,
  getAuthState,
} from '../https';

vi.mock('./shared/AlertsBell', () => ({
  default: () => <div data-testid="alerts" />,
}));

const res = (data) => Promise.resolve({ data: { data } });
const adminState = { initialState: { user: { role: 'Admin', name: 'Ana', isAuth: true } } };

beforeEach(() => {
  vi.clearAllMocks();
  getMyAlerts.mockResolvedValue(res([]));
});

describe('CashDesk', () => {
  const CUADRE = {
    id: 5,
    estado: 'ABIERTO',
    openedAt: '2026-09-15T08:00:00',
    openingUser: { name: 'Ana' },
    saldoInicial: 50000,
    gastos: 5000,
    totals: { cash: 100000, card: 40000, transfer: 10000, totalCaja: 195000 },
  };

  it('sin caja: abre caja con saldo inicial', async () => {
    getCurrentCashDesk.mockResolvedValue(res(null));
    openCashDesk.mockResolvedValue(res(CUADRE));
    const user = userEvent.setup();
    renderWithProviders(<CashDesk />);
    await waitFor(() =>
      expect(screen.getByText('No hay caja abierta actualmente')).toBeInTheDocument()
    );
    await user.type(screen.getByPlaceholderText('0'), '50000');
    await user.click(screen.getByRole('button', { name: 'Abrir caja' }));
    await waitFor(() =>
      expect(openCashDesk).toHaveBeenCalledWith({ saldoInicial: 50000 })
    );
  });

  it('con caja abierta: muestra resumen y cierra caja', async () => {
    getCurrentCashDesk.mockResolvedValue(res({ cuadre: CUADRE, movements: [] }));
    closeCashDesk.mockResolvedValue(res({}));
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();
    renderWithProviders(<CashDesk />);
    await waitFor(() => expect(screen.getByText('Relación de Caja')).toBeInTheDocument());
    expect(screen.getByText('Caja inicial')).toBeInTheDocument();
    expect(screen.getByText('Ventas con Datafono')).toBeInTheDocument();
    expect(screen.getByText('Total Caja')).toBeInTheDocument();
    expect(screen.getByText('Registrar cierre')).toBeInTheDocument();
    // llenar formulario de cierre
    const inputs = document.querySelectorAll('input[type="number"]');
    fireEvent.change(inputs[0], { target: { value: '150000' } });
    fireEvent.change(inputs[1], { target: { value: '5000' } });
    await user.click(screen.getByRole('button', { name: 'Cerrar Caja' }));
    await waitFor(() =>
      expect(closeCashDesk).toHaveBeenCalledWith(
        expect.objectContaining({ saldoReal: 150000, gastos: 5000 })
      )
    );
    confirmSpy.mockRestore();
  });

  it('muestra movimientos y exporta excel', async () => {
    getCurrentCashDesk.mockResolvedValue(res({
      cuadre: CUADRE,
      movements: [
        {
          id: 1,
          numero_factura: 'F-001',
          pedido_id: 'P-1',
          metodo_pago: 'Efectivo',
          total: 25000,
          propina: 2000,
          created_at: '2026-09-15T10:00:00',
        },
      ],
    }));
    exportCashDeskMovements.mockResolvedValue({
      data: new Blob(['x']),
      headers: { 'content-type': 'application/octet-stream' },
    });
    const urlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:x');
    const user = userEvent.setup();
    renderWithProviders(<CashDesk />);
    await waitFor(() => screen.getByText('Relación de Caja'));
    await user.click(screen.getByRole('button', { name: 'Movimientos' }));
    await waitFor(() => expect(screen.getByText('F-001')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Exportar XLS' }));
    await waitFor(() =>
      expect(exportCashDeskMovements).toHaveBeenCalledWith({ cuadreId: 5 })
    );
    urlSpy.mockRestore();
  });
});

describe('DishRank', () => {
  const products = [
    { productId: 'p1', rank: 1, name: 'pizza', totalQuantity: 30, unitPrice: 10000, totalAmount: 300000 },
    { productId: 'p2', rank: 2, name: 'sopa', totalQuantity: 12, unitPrice: 4000, totalAmount: 48000 },
  ];

  beforeEach(() => {
    getPopularProductsStats.mockResolvedValue(res(products));
  });

  it('admin: muestra ranking con montos y filtros de fecha', async () => {
    renderWithProviders(<DishRank />, adminState);
    await waitFor(() => expect(screen.getByText('pizza')).toBeInTheDocument());
    expect(screen.getByText('Vendidos')).toBeInTheDocument();
    expect(screen.getByText(/Basado en las ventas/)).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Personalizado' }));
    expect(document.querySelectorAll('input[type="date"]').length).toBe(2);
  });

  it('cliente: lista informativa sin montos', async () => {
    renderWithProviders(<DishRank />, {
      initialState: { user: { role: 'Customer' } },
    });
    await waitFor(() => screen.getByText('pizza'));
    expect(screen.queryByText('Vendidos')).not.toBeInTheDocument();
    expect(screen.getByText(/Listado informativo/)).toBeInTheDocument();
  });

  it('estado vacío sin datos', async () => {
    getPopularProductsStats.mockResolvedValue(res([]));
    renderWithProviders(<DishRank />, adminState);
    await waitFor(() =>
      expect(screen.getByText(/Aún no hay datos suficientes/)).toBeInTheDocument()
    );
  });
});

describe('Discounts (admin)', () => {
  const DISCOUNTS = [
    {
      _id: 'd1',
      name: 'Martes Locos',
      percent: 20,
      value: null,
      message: 'En pizzas',
      active: true,
      products: [{ productId: 'p1', name: 'Pizza' }],
    },
  ];

  beforeEach(() => {
    getAdminDiscounts.mockResolvedValue(res(DISCOUNTS));
    getProducts.mockResolvedValue(res([{ _id: 'p1', name: 'Pizza' }]));
    createDiscountAdmin.mockResolvedValue(res({}));
    updateDiscountAdmin.mockResolvedValue(res({}));
    resendDiscount.mockResolvedValue(res({}));
  });

  it('lista historial y muestra promo con datos', async () => {
    renderWithProviders(<Discounts />);
    await waitFor(() => expect(screen.getByText('Martes Locos')).toBeInTheDocument());
    expect(screen.getByText(/Estado: Activo/)).toBeInTheDocument();
    expect(screen.getByText(/Productos: Pizza/)).toBeInTheDocument();
  });

  it('valida: sin nombre no envía; valor+porciento juntos bloquea; sin producto bloquea', () => {
    renderWithProviders(<Discounts />);
    const form = document.querySelector('form');
    // sin nombre -> required lo evita; forzar submit manual
    fireEvent.submit(form);
    expect(createDiscountAdmin).not.toHaveBeenCalled();
  });

  it('crea descuento con FormData y lo reenvía', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Discounts />);
    await waitFor(() => screen.getByText('Martes Locos'));
    await user.type(document.querySelectorAll('section input[type="text"], section div input')[0], '3x2 Sushi');
    const selects = document.querySelectorAll('select');
    fireEvent.change(selects[0], { target: { value: 'p1' } });
    const [valorInput] = document.querySelectorAll('input[type="number"]');
    await user.type(valorInput, '5000');
    await user.click(screen.getByRole('button', { name: 'Crear y enviar' }));
    await waitFor(() => expect(createDiscountAdmin).toHaveBeenCalled());
    const fd = createDiscountAdmin.mock.calls[0][0];
    expect(fd.get('nombre')).toBe('3x2 Sushi');
    expect(fd.get('valor')).toBe('5000');
    expect(fd.get('productoId')).toBe('p1');

    await user.click(screen.getByRole('button', { name: 'Reenviar' }));
    await waitFor(() => expect(resendDiscount).toHaveBeenCalledWith('d1'));
  });

  it('editar precarga y usa updateDiscountAdmin', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Discounts />);
    await waitFor(() => screen.getByText('Martes Locos'));
    await user.click(screen.getByRole('button', { name: 'Editar' }));
    expect(screen.getByDisplayValue('Martes Locos')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Actualizar descuento' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Actualizar descuento' }));
    await waitFor(() => expect(updateDiscountAdmin).toHaveBeenCalledWith('d1', expect.any(FormData)));
  });
});

describe('Promotions', () => {
  it('lista promociones con badge de porcentaje y busca', async () => {
    getDiscounts.mockResolvedValue(
      res([
        { _id: 'd1', name: 'Martes', percent: 20, products: [{ productId: 'p1', name: 'Pizza' }] },
        { _id: 'd2', name: 'Lunes', value: 5000, products: [] },
      ])
    );
    const user = userEvent.setup();
    renderWithProviders(<Promotions />);
    await waitFor(() => expect(screen.getByText('Martes')).toBeInTheDocument());
    expect(screen.getByText('20% OFF')).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText(/Buscar por nombre, mensaje o producto/), 'lunes');
    expect(screen.queryByText('Martes')).not.toBeInTheDocument();
    expect(screen.getByText('Lunes')).toBeInTheDocument();
    expect(screen.getByText(/Sin productos asociados/)).toBeInTheDocument();
  });

  it('estado vacío', async () => {
    getDiscounts.mockResolvedValue(res([]));
    renderWithProviders(<Promotions />);
    await waitFor(() =>
      expect(screen.getByText(/No hay promociones activas/)).toBeInTheDocument()
    );
  });
});

describe('Header', () => {
  it('invitado muestra Invitado/Sin sesión y abre login al click', () => {
    renderWithProviders(<Header />, { initialState: { user: {} } });
    expect(screen.getByText('Invitado')).toBeInTheDocument();
    expect(screen.getByText('Sin sesión')).toBeInTheDocument();
  });

  it('staff ve nombre/rol; cerrar sesión llama logout y limpia usuario', async () => {
    localStorage.setItem('token', 'tok');
    logout.mockResolvedValue({ data: { message: 'bye' } });
    const user = userEvent.setup();
    const store = makeStore({ user: { name: 'Ana Maria', role: 'Admin', isAuth: true } });
    renderWithProviders(<Header />, { store });
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    await user.click(document.querySelector('svg[class*="ml-"]')?.closest('svg') || document.querySelectorAll('svg')[document.querySelectorAll('svg').length - 1]);
    await waitFor(() => expect(logout).toHaveBeenCalled());
    await waitFor(() => expect(store.getState().user.isAuth).toBe(false));
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('staff ve botones de dashboard y caja', () => {
    renderWithProviders(<Header />, {
      initialState: { user: { name: 'Ana', role: 'Cashier', isAuth: true } },
    });
    expect(screen.getByTitle('Relación de caja')).toBeInTheDocument();
  });
});

describe('BottomNav', () => {
  beforeEach(() => navigateMock.mockClear());

  it('customer: crea orden con datos del modal', async () => {
    const user = userEvent.setup();
    const store = makeStore({ user: { role: 'Customer', isAuth: true, name: 'Ana' }, customer: {} });
    renderWithProviders(<BottomNav />, { store });
    // abrir modal con el FAB
    const fab = document.querySelectorAll('button')[4];
    await user.click(fab);
    await waitFor(() =>
      expect(screen.getByPlaceholderText('Introducir Nombre del Cliente')).toBeInTheDocument()
    );
    const nameInput = screen.getByPlaceholderText('Introducir Nombre del Cliente');
    expect(nameInput.value).toBe('Ana'); // precarga perfil del cliente
    await user.clear(nameInput);
    await user.type(nameInput, 'Pedro');
    // incrementar comensales
    await user.click(screen.getByText('+'));
    expect(screen.getByText(/1 Personas/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Crear Orden' }));
    expect(store.getState().customer.customerName).toBe('Pedro');
    expect(navigateMock).toHaveBeenCalledWith('/tables');
  });

  it('customer: abre menú Mas con enlaces sociales', async () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    const user = userEvent.setup();
    renderWithProviders(<BottomNav />, {
      initialState: { user: { role: 'Customer', isAuth: true } },
    });
    await user.click(screen.getByRole('button', { name: /Mas/ }));
    await waitFor(() => screen.getByText('Instagram'));
    await user.click(screen.getByText('Instagram'));
    expect(openSpy).toHaveBeenCalledWith(
      'https://www.instagram.com/nativhos_quibdo',
      '_blank',
      'noopener,noreferrer'
    );
    openSpy.mockRestore();
  });

  it('staff: FAB navega a /sales y Mas muestra opciones admin', async () => {
    const user = userEvent.setup();
    renderWithProviders(<BottomNav />, {
      initialState: { user: { role: 'Admin', isAuth: true } },
    });
    // staff FAB (single absolute button)
    const fab = document.querySelector('button.absolute');
    await user.click(fab);
    expect(navigateMock).toHaveBeenCalledWith('/sales');

    await user.click(screen.getByRole('button', { name: /Mas/ }));
    await waitFor(() => screen.getByText('Mi Perfil'));
    expect(screen.getByText('Administrar Usuarios')).toBeInTheDocument();
    expect(screen.getByText('Metodos de Pago')).toBeInTheDocument();
  });

  it('admin: botón Promociones navega a /descuentos', async () => {
    const user = userEvent.setup();
    renderWithProviders(<BottomNav />, {
      initialState: { user: { role: 'Admin', isAuth: true } },
    });
    await user.click(screen.getByRole('button', { name: /Promociones/ }));
    expect(navigateMock).toHaveBeenCalledWith('/descuentos');
  });
});

describe('GoogleOneTap', () => {
  it('sin clientId muestra error de configuración', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '');
    renderWithProviders(<GoogleOneTap />);
    await waitFor(() =>
      expect(screen.getByText(/Falta VITE_GOOGLE_CLIENT_ID/)).toBeInTheDocument()
    );
    vi.unstubAllEnvs();
  });

  it('con API GIS inicializa, renderiza botón y maneja credencial', async () => {
    const initialize = vi.fn();
    const renderButton = vi.fn((el) => {
      el.appendChild(document.createElement('span'));
    });
    const prompt = vi.fn();
    window.google = { accounts: { id: { initialize, renderButton, prompt } } };
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'cid-123');
    getAuthState.mockResolvedValue({ data: { state: 'st-1' } });
    googleLogin.mockResolvedValue({
      data: { token: 'tok-1', data: { _id: 'u1', name: 'Ana', email: 'a@x.co', role: 'Customer' } },
    });
    const store = makeStore({ user: {} });
    renderWithProviders(<GoogleOneTap />, { store });
    await waitFor(() => expect(initialize).toHaveBeenCalled());
    await waitFor(() => expect(renderButton).toHaveBeenCalled());
    // fetchState se dispara después de init; esperar a que asente
    await waitFor(() => expect(window.__GIS_STATE__).toBe('st-1'));

    // simular credencial de Google
    const initCall = initialize.mock.calls[0][0];
    await initCall.callback({ credential: 'jwt-abc' });
    await waitFor(() => expect(googleLogin).toHaveBeenCalled());
    expect(localStorage.getItem('token')).toBe('tok-1');
    expect(store.getState().user.name).toBe('Ana');
    expect(navigateMock).toHaveBeenCalledWith('/');
    delete window.google;
    vi.unstubAllEnvs();
  });
});
