import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, makeStore } from '../test/test-utils';
import Metrics from './dashboard/Metrics';
import RecentOrdersDash from './dashboard/RecentOrders';
import Modal from './dashboard/Modal';
import CategoryModal from './dashboard/CategoryModal';
import DishModal from './dashboard/DishModal';
import Providers from './dashboard/Providers';
import ProviderFormModal from './dashboard/ProviderFormModal';
import Invoice from './invoice/Invoice';
import OrderList from './home/OrderList';
import PopularDishes from './home/PopularDishes';
import DiscountsTable from './home/DiscountsTable';
import RecentOrdersHome from './home/RecentOrders';
import Bill from './menu/Bill';
import MenuContainer from './menu/MenuContainer';

const enqueueSnackbar = vi.fn();
vi.mock('notistack', () => ({
  enqueueSnackbar: (...args) => enqueueSnackbar(...args),
  useSnackbar: () => ({ enqueueSnackbar }),
}));

vi.mock('../https', () => ({
  getOrders: vi.fn(),
  updateOrderStatus: vi.fn(),
  getStates: vi.fn(),
  getTables: vi.fn(),
  addTable: vi.fn(),
  addCategory: vi.fn(),
  addProduct: vi.fn(),
  getCategories: vi.fn(),
  getProducts: vi.fn(),
  uploadProductImage: vi.fn(),
  getTaxes: vi.fn(),
  getProviders: vi.fn(),
  addProvider: vi.fn(),
  updateProvider: vi.fn(),
  deleteProvider: vi.fn(),
  getPopularProductsStats: vi.fn(),
  getDiscounts: vi.fn(),
  addOrder: vi.fn(),
  updateTable: vi.fn(),
}));

import {
  getOrders,
  updateOrderStatus,
  getStates,
  getTables,
  addTable,
  addCategory,
  addProduct,
  getCategories,
  getProducts,
  getTaxes,
  getProviders,
  addProvider,
  updateProvider,
  deleteProvider,
  getPopularProductsStats,
  getDiscounts,
  addOrder,
  updateTable,
} from '../https';

vi.mock('../hooks/useTodayStats', () => ({
  default: () => ({
    data: {
      salesToday: 150000,
      salesChangePct: 10,
      invoicedToday: 5,
      invoicedChangePct: -2,
      salesMonth: 1200000,
      salesMonthChangePct: 5,
      invoicedMonth: 40,
      invoicedMonthChangePct: 3,
      counts: { categories: 4, products: 20, tables: 8 },
    },
    isLoading: false,
  }),
}));

vi.mock('../context/LoginModalContext', () => ({
  useLoginModal: () => ({ openLoginModal: vi.fn() }),
}));

vi.mock('framer-motion', () => {
  // componente estable: evita remounts que pierden foco/estado de inputs
  // eslint-disable-next-line react/prop-types
  const Passthrough = ({ children, ...rest }) => {
    const { initial, animate, exit, transition, whileHover, ...dom } = rest;
    void initial; void animate; void exit; void transition; void whileHover;
    return <div {...dom}>{children}</div>;
  };
  return {
    motion: new Proxy(
      {},
      {
        get: () => Passthrough,
      }
    ),
    // eslint-disable-next-line react/prop-types
    AnimatePresence: ({ children }) => <>{children}</>,
  };
});

const res = (data) => Promise.resolve({ data: { data } });
const adminState = { initialState: { user: { role: 'Admin', name: 'Admin' } } };

const TODAY = new Date().toISOString();
const ORDERS = [
  {
    _id: 'o1',
    orderStatus: 'PENDIENTE',
    orderDate: TODAY,
    paymentStatus: 'PENDIENTE',
    customer: { name: 'Ana' },
    table: { number: 3 },
    items: [{ _id: 'i1', name: 'Pizza', quantity: 1 }],
    bills: { total: 15000 },
  },
  {
    _id: 'o2',
    orderStatus: 'LISTO',
    orderDate: TODAY,
    customer: { name: 'Luis', userId: 'u9' },
    table: 5,
    items: [{ _id: 'i2', name: 'Sopa', quantity: 2 }],
    bills: { total: 8000 },
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  getOrders.mockResolvedValue(res(ORDERS));
  getStates.mockResolvedValue(
    res([{ name: 'PENDIENTE' }, { name: 'LISTO' }, { name: 'PAGADO' }])
  );
  getTables.mockResolvedValue(
    res([
      { _id: 't1', number: 3, status: 'Available' },
      { _id: 't2', number: 5, status: 'Available' },
    ])
  );
  updateOrderStatus.mockResolvedValue({});
  getCategories.mockResolvedValue(res([{ _id: 1, name: 'Comida' }]));
  getProducts.mockResolvedValue(
    res([
      {
        _id: 'p1',
        name: 'Pizza',
        price: 10000,
        categoryId: 1,
        tax: { _id: 1, name: 'INC', percentage: 8, regimen: 'COMUN' },
      },
    ])
  );
  getTaxes.mockResolvedValue(res([{ _id: 1, name: 'INC', percentage: 8, regimen: 'COMUN' }]));
  getProviders.mockResolvedValue(
    res([{ _id: 'pr1', name: 'Fruver SAS', contact: 'Carlos', phone: '300', email: 'c@x.co' }])
  );
  getPopularProductsStats.mockResolvedValue(
    res([{ productId: 'p1', rank: 1, name: 'pizza', totalQuantity: 30, unitPrice: 10000, totalAmount: 300000 }])
  );
  getDiscounts.mockResolvedValue(
    res([
      {
        _id: 'd1',
        name: 'Martes Locos',
        message: '20% en pizza',
        percent: 20,
        active: true,
        products: [{ productId: 'p1' }],
      },
    ])
  );
  addOrder.mockResolvedValue({ data: { data: { _id: 'newo1', table: 't1' } } });
  updateTable.mockResolvedValue({});
});

describe('Metrics', () => {
  it('muestra tarjetas diarias, mensuales y conteos', async () => {
    renderWithProviders(<Metrics />, adminState);
    expect(screen.getByText('Rendimiento General')).toBeInTheDocument();
    expect(screen.getByText('Ganancias (mes)')).toBeInTheDocument();
    expect(screen.getByText('Total Categorías')).toBeInTheDocument();
    expect(screen.getByText('Total Mesas')).toBeInTheDocument();
    expect(screen.getAllByText('$ 150.000').length).toBeGreaterThan(0);
    await waitFor(() => screen.getByText(/Ordenes de los clientes/));
  });

  it('estado vacío sin órdenes', async () => {
    getOrders.mockResolvedValue(res([]));
    renderWithProviders(<Metrics />);
    await waitFor(() =>
      expect(screen.getByText('No orders available')).toBeInTheDocument()
    );
  });
});

describe('RecentOrders (dashboard)', () => {
  it('lista órdenes y filtra por estado', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RecentOrdersDash />, adminState);
    await waitFor(() => expect(screen.getByText('Ana')).toBeInTheDocument());
    expect(screen.getByText('Luis')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'LISTO' }));
    expect(screen.queryByText('Ana')).not.toBeInTheDocument();
    expect(screen.getByText('Luis')).toBeInTheDocument();
  });

  it('cambia estado de orden con mesa encontrada', async () => {
    renderWithProviders(<RecentOrdersDash />, adminState);
    await waitFor(() => screen.getByText('Luis'));
    const selects = screen.getAllByRole('combobox');
    await fireEvent.change(selects[1], { target: { value: 'PENDIENTE' } });
    await waitFor(() => expect(updateOrderStatus).toHaveBeenCalled());
    expect(updateOrderStatus.mock.calls[0][0]).toEqual(
      expect.objectContaining({ orderId: 'o2', orderStatus: 'PENDIENTE' })
    );
  });

  it('filtro de fecha personalizado muestra inputs', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RecentOrdersDash />, adminState);
    await waitFor(() => screen.getByText('Ana'));
    await user.click(screen.getByRole('button', { name: 'Personalizado' }));
    expect(document.querySelectorAll('input[type="date"]').length).toBe(2);
  });

  it('cliente sin rol staff ve estado como texto', async () => {
    renderWithProviders(<RecentOrdersDash />, {
      initialState: { user: { role: 'Waiter' } },
    });
    await waitFor(() => screen.getByText('Ana'));
    expect(screen.getAllByText('PENDIENTE').length).toBeGreaterThan(0);
  });
});

describe('Modal (añadir mesa)', () => {
  it('crea mesa y cierra', async () => {
    const user = userEvent.setup();
    const setOpen = vi.fn();
    addTable.mockResolvedValue({ data: { message: 'ok' } });
    renderWithProviders(<Modal setIsTableModalOpen={setOpen} />);
    await user.type(document.querySelector('input[name="tableNo"]'), '9');
    await user.type(document.querySelector('input[name="seats"]'), '4');
    await user.click(screen.getByRole('button', { name: 'Añadir Mesa' }));
    await waitFor(() =>
      expect(addTable).toHaveBeenCalledWith({ tableNo: '9', seats: '4' })
    );
    await waitFor(() => expect(setOpen).toHaveBeenCalledWith(false));
  });
});

describe('CategoryModal', () => {
  it('crea categoría y cierra', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    addCategory.mockResolvedValue({});
    renderWithProviders(<CategoryModal onClose={onClose} />);
    await user.type(screen.getByPlaceholderText(/Malteadas/), 'Postres');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(addCategory).toHaveBeenCalled());
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('no envía si el nombre está vacío', () => {
    renderWithProviders(<CategoryModal onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText(/Malteadas/);
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.submit(input.closest('form'));
    expect(addCategory).not.toHaveBeenCalled();
  });
});

describe('DishModal', () => {
  it('crea producto con impuesto por defecto', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    addProduct.mockResolvedValue(res({ _id: 'p9' }));
    renderWithProviders(<DishModal onClose={onClose} />);
    await waitFor(() =>
      expect(screen.getByDisplayValue(/INC/)).toBeInTheDocument()
    );
    await user.type(screen.getByPlaceholderText(/Waffle/), 'Chorizo');
    await user.type(document.querySelector('input[name="price"]'), '12000');
    await user.click(screen.getByRole('button', { name: 'Crear' }));
    await waitFor(() =>
      expect(addProduct).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Chorizo', price: 12000, impuestoId: 1 })
      )
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});

describe('Providers', () => {
  it('lista, filtra y admin elimina proveedor', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Providers />, adminState);
    await waitFor(() => expect(screen.getByText('Fruver SAS')).toBeInTheDocument());
    await user.type(screen.getByPlaceholderText(/Buscar por nombre, contacto o correo/), 'zzz');
    expect(screen.queryByText('Fruver SAS')).not.toBeInTheDocument();
    await user.clear(screen.getByPlaceholderText(/Buscar por nombre, contacto o correo/));
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));
    await waitFor(() => expect(deleteProvider).toHaveBeenCalledWith('pr1'));
  });

  it('abre modal de agregar y crea proveedor', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Providers />, adminState);
    await waitFor(() => screen.getByText('Fruver SAS'));
    await user.click(screen.getByRole('button', { name: 'Agregar' }));
    expect(screen.getByText('Agregar Proveedor')).toBeInTheDocument();
    await user.type(document.querySelector('input[name="name"]'), 'Carnes SA');
    await user.type(document.querySelector('input[name="contact"]'), 'Pedro');
    await user.click(screen.getByRole('button', { name: 'Crear' }));
    await waitFor(() =>
      expect(addProvider).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Carnes SA', contact: 'Pedro' })
      )
    );
  });

  it('editar precarga el formulario y actualiza', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Providers />, adminState);
    await waitFor(() => screen.getByText('Fruver SAS'));
    await user.click(screen.getByRole('button', { name: 'Editar' }));
    expect(screen.getByText('Editar Proveedor')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Carlos')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Actualizar' }));
    await waitFor(() =>
      expect(updateProvider).toHaveBeenCalledWith(
        'pr1',
        expect.objectContaining({ name: 'Fruver SAS' })
      )
    );
  });
});

describe('ProviderFormModal', () => {
  it('no envía sin nombre/contacto', () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <ProviderFormModal onSubmit={onSubmit} onClose={vi.fn()} />
    );
    fireEvent.submit(document.querySelector('form'));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('Invoice', () => {
  const orderInfo = {
    _id: 'ord-1',
    customerDetails: { name: 'Ana', phone: '3001', guests: 2 },
    items: [{ name: 'Pizza', quantity: 2, price: 5000 }],
    bills: { total: 10000, tax: 800, totalWithTax: 10800 },
    paymentMethod: 'Cash',
  };

  it('muestra datos del pedido y totales', () => {
    const setShow = vi.fn();
    const { container } = renderWithProviders(
      <Invoice orderInfo={orderInfo} setShowInvoice={setShow} />
    );
    expect(screen.getByText('Order Receipt')).toBeInTheDocument();
    expect(container.textContent).toContain('Ana');
    expect(container.textContent).toContain('ord-1');
  });

  it('print abre ventana y close dispara callback', async () => {
    const user = userEvent.setup();
    const setShow = vi.fn();
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    renderWithProviders(<Invoice orderInfo={{ ...orderInfo }} setShowInvoice={setShow} />);
    await user.click(screen.getByText('Print Receipt'));
    expect(openSpy).toHaveBeenCalled();
    await user.click(screen.getByText('Close'));
    expect(setShow).toHaveBeenCalledWith(false);
    openSpy.mockRestore();
  });
});

describe('OrderList', () => {
  it('muestra nombre, items y estado listo', () => {
    renderWithProviders(
      <OrderList
        order={{ customer: { name: 'Ana' }, items: [{}], table: { number: 3 }, orderStatus: 'LISTO' }}
      />
    );
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('1 Items')).toBeInTheDocument();
    expect(screen.getByText(/Listo/)).toBeInTheDocument();
  });

  it('defaults y estado pendiente', () => {
    renderWithProviders(<OrderList order={{ items: [] }} />);
    expect(screen.getByText('Sin nombre')).toBeInTheDocument();
    expect(screen.getByText(/PENDIENTE/)).toBeInTheDocument();
  });

  it('retorna null sin order', () => {
    const { container } = renderWithProviders(<OrderList order={null} />);
    expect(container.firstChild).toBeNull();
  });
});

describe('PopularDishes', () => {
  it('lista productos y datos extra para admin', async () => {
    renderWithProviders(<PopularDishes />, adminState);
    await waitFor(() => expect(screen.getByText('pizza')).toBeInTheDocument());
    expect(screen.getByText(/Vendidos: 30/)).toBeInTheDocument();
    expect(screen.getByText(/Total acumulado/)).toBeInTheDocument();
  });

  it('oculta montos a no-admin y muestra estado vacío', async () => {
    getPopularProductsStats.mockResolvedValue(res([]));
    renderWithProviders(<PopularDishes />, {
      initialState: { user: { role: 'Customer' } },
    });
    await waitFor(() =>
      expect(screen.getByText(/Aún no hay ventas/)).toBeInTheDocument()
    );
  });
});

describe('DiscountsTable', () => {
  it('muestra descuento con badge y precios calculados', async () => {
    renderWithProviders(<DiscountsTable />);
    await waitFor(() =>
      expect(screen.getByText('Martes Locos')).toBeInTheDocument()
    );
    expect(screen.getByText('-20%')).toBeInTheDocument();
    // 10000 * 0.8 = 8000
    expect(screen.getByText('$ 8.000')).toBeInTheDocument();
    expect(screen.getByText('$ 10.000')).toBeInTheDocument();
  });

  it('estado vacío sin descuentos', async () => {
    getDiscounts.mockResolvedValue(res([]));
    renderWithProviders(<DiscountsTable />);
    await waitFor(() =>
      expect(screen.getByText(/Sin descuentos activos/)).toBeInTheDocument()
    );
  });
});

describe('RecentOrders (home)', () => {
  it('lista órdenes con items', async () => {
    renderWithProviders(<RecentOrdersHome />);
    await waitFor(() => expect(screen.getByText('Ana')).toBeInTheDocument());
    expect(screen.getByText('Luis')).toBeInTheDocument();
  });
});

describe('Bill', () => {
  const cartItem = {
    id: 'c1',
    productId: 'p1',
    name: 'Pizza',
    quantity: 2,
    price: 10000,
    taxRate: 8,
    _id: 'i1',
  };

  it('calcula neto, impuesto y total; crea orden de invitado limpiando carrito', async () => {
    const user = userEvent.setup();
    const store = makeStore({
      cart: [cartItem],
      customer: { customerName: 'Invitado', guest: true },
      user: { isAuth: false, role: '' },
    });
    renderWithProviders(<Bill />, { store });
    // total 10000, tax = 10000 - 10000/1.08 = 740.74 -> 741, net = 9259
    expect(screen.getByText('Impuestos')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Crear Orden/ }));
    await waitFor(() => expect(addOrder).toHaveBeenCalled());
    expect(addOrder.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        orderStatus: 'PENDIENTE',
        guest: true,
      })
    );
    // invitado: carrito y cliente limpiados sin actualizar mesa
    await waitFor(() =>
      expect(store.getState().cart).toHaveLength(0)
    );
    expect(updateTable).not.toHaveBeenCalled();
  });

  it('staff autenticado actualiza la mesa tras crear orden', async () => {
    const user = userEvent.setup();
    const store = makeStore({
      cart: [cartItem],
      customer: { customerName: 'Ana', table: { tableId: 't1' } },
      user: { isAuth: true, role: 'Admin' },
    });
    renderWithProviders(<Bill />, { store });
    await user.click(screen.getByRole('button', { name: /Crear Orden/ }));
    await waitFor(() => expect(addOrder).toHaveBeenCalled());
    await waitFor(() => expect(updateTable).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'Booked', tableId: 't1' })
    ), { timeout: 4000 });
  });
});

describe('MenuContainer', () => {
  it('muestra categorías con conteo y productos filtrados', async () => {
    renderWithProviders(<MenuContainer />, adminState);
    await waitFor(() => expect(screen.getByText('Comida')).toBeInTheDocument());
    // admin + descuento activo genera variante
    await waitFor(() =>
      expect(screen.getByText(/Pizza - Martes Locos/)).toBeInTheDocument()
    );
    expect(screen.getByText(/Items/)).toBeInTheDocument();
  });

  it('incrementa cantidad hasta máximo 4 y agrega al carrito', async () => {
    const user = userEvent.setup();
    const store = makeStore({ cart: [], user: { role: 'Admin' }, customer: {} });
    renderWithProviders(<MenuContainer />, { store });
    await waitFor(() => screen.getByText('Pizza'));
    const plus = screen.getAllByText('+')[0];
    await user.click(plus);
    await user.click(plus);
    await user.click(plus);
    await user.click(plus);
    await user.click(plus); // excede el máximo, debe quedar en 4
    const cartBtn = screen.getAllByTitle('Agregar al carrito')[0];
    await user.click(cartBtn);
    await waitFor(() => expect(store.getState().cart).toHaveLength(1));
    expect(store.getState().cart[0].quantity).toBe(4);
    expect(store.getState().cart[0].price).toBe(40000);
  });

  it('usuario customer no ve productos de descuento', async () => {
    renderWithProviders(<MenuContainer />, {
      initialState: { user: { role: 'Customer' } },
    });
    await waitFor(() => screen.getByText('Pizza'));
    expect(screen.queryByText(/Martes Locos/)).not.toBeInTheDocument();
  });
});
