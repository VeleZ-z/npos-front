import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test/test-utils';
import Tables from './Tables';
import Cashier from './Cashier';
import Inventory from './Inventory';
import Sales from './Sales';

vi.mock('notistack', () => ({
  enqueueSnackbar: vi.fn(),
}));

vi.mock('../https', () => ({
  getTables: vi.fn(),
  getOrders: vi.fn(),
  getOrderById: vi.fn(),
  createInvoice: vi.fn(),
  getProducts: vi.fn(),
  getStates: vi.fn(),
  updateProduct: vi.fn(),
  updateProductStockState: vi.fn(),
  getCategories: vi.fn(),
  uploadProductImage: vi.fn(),
  getTaxes: vi.fn(),
  deleteProduct: vi.fn(),
  getOrderByTable: vi.fn(),
  addItemToTable: vi.fn(),
  updateOrderItem: vi.fn(),
  deleteOrderItem: vi.fn(),
  moveOrderItem: vi.fn(),
  getDiscounts: vi.fn(),
  updateOrderStatus: vi.fn(),
  deleteOrder: vi.fn(),
  searchUsers: vi.fn(),
  setOrderCustomer: vi.fn(),
  markOrderItemsPrinted: vi.fn(),
  getPayMethods: vi.fn(),
  getOrderHistory: vi.fn(),
}));

import {
  getTables,
  getOrders,
  getOrderById,
  createInvoice,
  getProducts,
  getStates,
  updateProduct,
  updateProductStockState,
  getCategories,
  getTaxes,
  deleteProduct,
  getOrderByTable,
  addItemToTable,
  getDiscounts,
  updateOrderStatus,
  deleteOrder,
  setOrderCustomer,
  getPayMethods,
} from '../https';

vi.mock('../components/dashboard/DishModal', () => ({
  default: () => <div data-testid="dish-modal" />,
}));

const res = (data) => Promise.resolve({ data: { data } });

const TABLES = [
  { _id: 't1', number: 1, status: 'Available', capacity: 4, currentOrder: null },
  {
    _id: 't2',
    number: 2,
    status: 'Booked',
    capacity: 2,
    currentOrder: { customer: { name: 'Juan' } },
  },
];

const ORDER = {
  _id: 'order1',
  orderStatus: 'POR_APROBAR',
  customer: null,
  cashierName: 'Admin',
  items: [
    {
      _id: 'it1',
      name: 'Pizza',
      quantity: 2,
      price: 10000,
      printedQty: 1,
      note: 'Sin cebolla',
    },
  ],
  bills: { total: 20000, tax: 1600, subtotal: 18400 },
};

const adminState = { initialState: { user: { role: 'Admin', name: 'Admin' } } };

describe('Tables', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getTables.mockResolvedValue({ data: { data: TABLES } });
  });

  it('renderiza el título, filtros y las mesas', async () => {
    renderWithProviders(<Tables />);
    expect(screen.getByText('Mesas')).toBeInTheDocument();
    expect(screen.getByText('Todas')).toBeInTheDocument();
    expect(screen.getByText('Ocupadas')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText(/Table.*1/)).toBeInTheDocument()
    );
    expect(screen.getByText(/Table.*2/)).toBeInTheDocument();
  });
});

describe('Cashier', () => {
  const orders = [
    {
      _id: 'o1',
      orderStatus: 'ENTREGADO',
      paymentStatus: 'PENDIENTE',
      orderDate: new Date('2026-01-01T10:00:00'),
      customer: { name: 'Ana', phone: '3001234567' },
      table: { number: 5 },
      items: [{ _id: 'i1', name: 'Pizza', quantity: 2, price: 10000 }],
      bills: { total: 20000, subtotal: 18400, tax: 1600 },
    },
    {
      _id: 'o2',
      orderStatus: 'PENDIENTE',
      paymentStatus: 'PENDIENTE',
      orderDate: new Date(),
      items: [],
      bills: { total: 0 },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    getOrders.mockResolvedValue({ data: orders });
    getOrderById.mockResolvedValue({ data: { data: orders[0] } });
    createInvoice.mockResolvedValue({ data: { data: { _id: 'inv1' } } });
  });

  it('lista solo órdenes ENTREGADAS pendientes de pago', async () => {
    renderWithProviders(<Cashier />, adminState);
    await waitFor(() =>
      expect(screen.getByText(/Órdenes Pendientes de Pago \(1\)/)).toBeInTheDocument()
    );
    expect(screen.getByText('Ana')).toBeInTheDocument();
  });

  it('muestra formulario al seleccionar orden y genera factura', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Cashier />, adminState);
    await waitFor(() => screen.getByText('Ana'));
    await user.click(screen.getByText('Ana'));
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Generar Factura' })
      ).toBeInTheDocument()
    );
    expect(screen.getByText('Resumen de la Orden')).toBeInTheDocument();
    // el cliente de la orden precarga el nombre
    expect(screen.getByDisplayValue('Ana')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Generar Factura' }));
    await waitFor(() => expect(createInvoice).toHaveBeenCalled());
    expect(createInvoice.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        orderId: 'o1',
        customerData: expect.objectContaining({ name: 'Ana' }),
      })
    );
  });

  it('no envía customerData para consumidor final', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Cashier />, adminState);
    await waitFor(() => screen.getByText('Ana'));
    await user.click(screen.getByText('Ana'));
    await waitFor(() =>
      screen.getByRole('button', { name: 'Generar Factura' })
    );
    // restablecer nombre a CONSUMIDOR FINAL
    const nameInput = screen.getByDisplayValue('Ana');
    await user.clear(nameInput);
    await user.type(nameInput, 'CONSUMIDOR FINAL');
    await user.click(screen.getByRole('button', { name: 'Generar Factura' }));
    await waitFor(() => expect(createInvoice).toHaveBeenCalled());
    expect(createInvoice.mock.calls[0][0]).toEqual(
      expect.objectContaining({ customerData: undefined })
    );
  });
});

describe('Inventory', () => {
  const products = [
    {
      _id: 'p1',
      name: 'Pizza',
      barcode: '111',
      price: 10000,
      cost: 5000,
      quantity: 3,
      alertMinStock: 5,
      categoryId: 1,
      category: { name: 'Comida' },
    },
    {
      _id: 'p2',
      name: 'Limonada',
      barcode: '222',
      price: 4000,
      cost: 1000,
      quantity: 20,
      categoryId: 2,
      category: { name: 'Bebidas' },
    },
  ];
  const categories = [
    { _id: 1, name: 'Comida' },
    { _id: 2, name: 'Bebidas' },
  ];
  const taxes = [
    { _id: 1, name: 'INC', percentage: 8, regimen: 'COMUN' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    getProducts.mockResolvedValue(res(products));
    getStates.mockResolvedValue(res([{ _id: 1, name: 'ACTIVO' }]));
    getCategories.mockResolvedValue(res(categories));
    getTaxes.mockResolvedValue(res(taxes));
    updateProduct.mockResolvedValue({});
    updateProductStockState.mockResolvedValue({});
    deleteProduct.mockResolvedValue({});
  });

  it('lista productos y filtra por texto', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Inventory />, adminState);
    await waitFor(() =>
      expect(screen.getByDisplayValue('Pizza')).toBeInTheDocument()
    );
    const search = screen.getByPlaceholderText(/Buscar por nombre/);
    await user.type(search, 'limonada');
    expect(screen.getByDisplayValue('Limonada')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Pizza')).not.toBeInTheDocument();
  });

  it('filtra por categoría', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Inventory />, adminState);
    await waitFor(() => screen.getByDisplayValue('Pizza'));
    await user.click(screen.getByRole('button', { name: 'Bebidas' }));
    expect(screen.queryByDisplayValue('Pizza')).not.toBeInTheDocument();
  });

  it('admin guarda producto completo y staff solo stock/estado', async () => {
    const user = userEvent.setup();
    const { unmount } = renderWithProviders(<Inventory />, adminState);
    await waitFor(() => screen.getByDisplayValue('Pizza'));
    await user.click(screen.getAllByRole('button', { name: 'Guardar' })[0]);
    await waitFor(() =>
      expect(updateProduct).toHaveBeenCalledWith(
        'p1',
        expect.objectContaining({ name: 'Pizza' })
      )
    );
    unmount();

    renderWithProviders(<Inventory />, {
      initialState: { user: { role: 'Cashier' } },
    });
    await waitFor(() => screen.getByDisplayValue('Pizza'));
    await user.click(screen.getAllByRole('button', { name: 'Guardar' })[0]);
    await waitFor(() =>
      expect(updateProductStockState).toHaveBeenCalledWith(
        'p1',
        expect.objectContaining({ quantity: 3 })
      )
    );
  });

  it('elimina solo si el nombre confirmado coincide', async () => {
    const user = userEvent.setup();
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('Pizza');
    renderWithProviders(<Inventory />, adminState);
    await waitFor(() => screen.getByDisplayValue('Pizza'));
    await user.click(screen.getAllByRole('button', { name: 'Eliminar' })[0]);
    await waitFor(() => expect(deleteProduct).toHaveBeenCalledWith('p1'));
    promptSpy.mockRestore();
  });

  it('resalta fila con stock bajo y abre modal de añadir', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Inventory />, adminState);
    await waitFor(() => screen.getByDisplayValue('Pizza'));
    // stock 3 <= alertMinStock 5 → fila con fondo de alerta
    const row = screen.getByDisplayValue('Pizza').closest('tr');
    expect(row.className).toContain('bg-[#2a1515]');
    await user.click(screen.getByRole('button', { name: /Añadir Producto/ }));
    expect(screen.getByTestId('dish-modal')).toBeInTheDocument();
  });
});

describe('Sales', () => {
  const categories = [{ _id: 1, name: 'Comida' }];
  const products = [
    {
      _id: 'p1',
      name: 'Pizza',
      price: 10000,
      categoryId: 1,
      tax: { percentage: 8 },
    },
  ];
  const payMethods = [
    { _id: 'pm1', name: 'Efectivo', estado: 'ACTIVO' },
    { _id: 'pm2', name: 'Datafono', estado: 'ACTIVO' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    getTables.mockResolvedValue(res(TABLES));
    getOrderByTable.mockResolvedValue(res(ORDER));
    getProducts.mockResolvedValue(res(products));
    getCategories.mockResolvedValue(res(categories));
    getDiscounts.mockResolvedValue(res([]));
    getStates.mockResolvedValue(
      res([{ name: 'POR_APROBAR' }, { name: 'PENDIENTE' }, { name: 'LISTO' }])
    );
    getPayMethods.mockResolvedValue(res(payMethods));
    updateOrderStatus.mockResolvedValue({});
    deleteOrder.mockResolvedValue({});
    setOrderCustomer.mockResolvedValue(res({ ...ORDER, customer: { name: 'Ana' } }));
    addItemToTable.mockResolvedValue(res(ORDER));
    createInvoice.mockResolvedValue(res({ order: { ...ORDER, orderStatus: 'PAGADO' }, invoice: null }));
  });

  it('muestra mesas y al seleccionar una carga el pedido', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Sales />, adminState);
    const tableCard = await screen.findByText('01');
    await user.click(tableCard);
    await waitFor(() => expect(getOrderByTable).toHaveBeenCalledWith('t1'));
    // muestra el item del pedido
    await waitFor(() => expect(screen.getAllByText('Pizza').length).toBeGreaterThan(0));
    expect(screen.getByRole('button', { name: 'Asignar cliente' })).toBeInTheDocument();
  });

  it('alterna a vista de productos y agrega producto a la mesa', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Sales />, adminState);
    await waitFor(() => screen.getByText('01'));
    // seleccionar mesa + ir a productos via botón Agregar del card
    await user.click(screen.getAllByRole('button', { name: /Agregar/ })[0]);
    await waitFor(() => screen.getByPlaceholderText('Buscar producto'));
    // click en el producto
    const pizzas = screen.getAllByText('Pizza');
    await user.click(pizzas.find((el) => el.closest('button')));
    await waitFor(() =>
      expect(addItemToTable).toHaveBeenCalledWith(
        't1',
        expect.objectContaining({ productId: 'p1', price: 10000 })
      )
    );
  });

  it('abre modal de cliente y asigna nombre manual', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Sales />, adminState);
    await waitFor(() => screen.getByText('01'));
    await user.click(screen.getByText('01'));
    await waitFor(() => screen.getByText('Asignar cliente'));
    await user.click(screen.getByText('Asignar cliente'));
    await waitFor(() =>
      expect(screen.getByPlaceholderText('Nombre del cliente')).toBeInTheDocument()
    );
    const input = screen.getByPlaceholderText('Nombre del cliente');
    await user.type(input, 'Pedro');
    await user.click(screen.getByRole('button', { name: 'Guardar nombre' }));
    await waitFor(() =>
      expect(setOrderCustomer).toHaveBeenCalledWith('order1', {
        name: 'Pedro',
        phone: null,
      })
    );
  });

  it('abre modal de factura, calcula cambio y factura con NIT fallback', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Sales />, adminState);
    await waitFor(() => screen.getByText('01'));
    await user.click(screen.getByText('01'));
    await waitFor(() =>
      expect(
        screen.getAllByRole('button', { name: /^Facturar$/ }).length
      ).toBeGreaterThan(0)
    );
    const facturarBtns = screen.getAllByRole('button', { name: /^Facturar$/ });
    await user.click(facturarBtns[0]);
    await waitFor(() =>
      expect(screen.getByText('Medio de pago')).toBeInTheDocument()
    );
    // método por defecto: Efectivo (primero de la lista)
    await waitFor(() =>
      expect(screen.getByText('Monto recibido')).toBeInTheDocument()
    );
    const amountInput = document.querySelector('input[type="number"]');
    await user.type(amountInput, '30000');
    // cambio = 30000 - 20000 = 10000
    expect(screen.getAllByText('10.000').length).toBeGreaterThan(0);
    const submitBtns = screen.getAllByRole('button', { name: /^Facturar$/ });
    await user.click(submitBtns[submitBtns.length - 1]);
    await waitFor(() => expect(createInvoice).toHaveBeenCalled());
    expect(createInvoice.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        orderId: 'order1',
        paymentType: 'CONTADO',
        cashAmount: 30000,
      })
    );
  });

  it('cambia el estado del pedido siendo staff', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Sales />, adminState);
    await waitFor(() => screen.getByText('01'));
    await user.click(screen.getAllByRole('button', { name: /Agregar/ })[0]);
    const select = await screen.findByDisplayValue('POR_APROBAR');
    // fireEvent en vez de userEvent: el select está dentro del botón "Total"
    // (un click real dispararía también el reset de mesa del botón padre)
    fireEvent.change(select, { target: { value: 'PENDIENTE' } });
    await waitFor(() => expect(updateOrderStatus).toHaveBeenCalled());
    expect(updateOrderStatus.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        orderId: 'order1',
        orderStatus: 'PENDIENTE',
        tableId: 't1',
      })
    );
  });

  it('mueve un ítem a otra mesa libre', async () => {
    const user = userEvent.setup();
    addItemToTable.mockResolvedValue(res(ORDER));
    renderWithProviders(<Sales />, adminState);
    await waitFor(() => screen.getByText('01'));
    await user.click(screen.getByText('01'));
    await waitFor(() => screen.getByText('Pizza'));
    await user.click(screen.getByRole('button', { name: /Mover/ }));
    await waitFor(() => screen.getByText('Mover Producto'));
    // mesa 02 en la lista de destino
    await user.click(screen.getByRole('button', { name: /Mesa 02/ }));
    await waitFor(() =>
      expect(getOrderByTable).toHaveBeenCalledTimes(1)
    );
  });

  it('imprime comanda y marca ítems impresos', async () => {
    const user = userEvent.setup();
    const fakeDoc = {
      title: '',
      head: { innerHTML: '', appendChild: vi.fn() },
      body: { innerHTML: '' },
      createElement: () => ({ textContent: '' }),
    };
    const fakeWin = {
      document: fakeDoc,
      focus: vi.fn(),
      print: vi.fn(),
      close: vi.fn(),
    };
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(fakeWin);
    renderWithProviders(<Sales />, adminState);
    await waitFor(() => screen.getByText('01'));
    await user.click(screen.getByText('01'));
    await waitFor(() => screen.getByRole('button', { name: /Imprimir Comanda/ }));
    await user.click(screen.getByRole('button', { name: /Imprimir Comanda/ }));
    await waitFor(() => expect(openSpy).toHaveBeenCalled());
    expect(fakeDoc.title).toBe('COMANDA');
    // item pendiente (qty 2 - impreso 1)
    expect(fakeDoc.body.innerHTML).toContain('PIZZA');
    fakeWin.print();
    fakeWin.close();
    openSpy.mockRestore();
  });

  it('busca usuarios en modal de cliente y asigna por userId', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<Sales />, adminState);
    await waitFor(() => screen.getByText('01'));
    await user.click(screen.getByText('01'));
    await waitFor(() => screen.getByRole('button', { name: 'Asignar cliente' }));
    await user.click(screen.getByRole('button', { name: 'Asignar cliente' }));
    const searchInput = screen.getByPlaceholderText(/Buscar por nombre, correo/);
    await user.type(searchInput, 'pedro');
    // avanzar debounce
    await vi.advanceTimersByTimeAsync(400);
    await waitFor(() =>
      expect(screen.getByText(/Sin resultados|Buscando/)).toBeInTheDocument()
    );
    vi.useRealTimers();
  });

  it('staff ve productos con descuento activo', async () => {
    getDiscounts.mockResolvedValue(
      res([
        {
          _id: 'd1',
          active: true,
          name: '10-off',
          percent: 10,
          products: [{ productId: 'p1' }],
        },
      ])
    );
    renderWithProviders(<Sales />, adminState);
    await waitFor(() => screen.getByText('01'));
    const user = userEvent.setup();
    await user.click(screen.getAllByRole('button', { name: /Agregar/ })[0]);
    await waitFor(() => screen.getByPlaceholderText('Buscar producto'));
    await waitFor(() =>
      expect(screen.getByText(/Pizza - 10-off/)).toBeInTheDocument()
    );
    // precio original tachado + variante generada a partir del descuento
    expect(screen.getAllByText(/\$ ?10[.,]000/).length).toBeGreaterThan(0);
  });

  it('invitado (no auth) no tiene botón Facturar ni select de estado', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Sales />, { initialState: { user: {} } });
    await waitFor(() => screen.getByText('01'));
    await user.click(screen.getByText('01'));
    await waitFor(() => screen.getByText('Pizza'));
    expect(screen.queryByRole('button', { name: /^Facturar$/ })).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('POR_APROBAR')).not.toBeInTheDocument();
  });

  it('elimina el pedido POR_APROBAR tras confirmación', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderWithProviders(<Sales />, adminState);
    await waitFor(() => screen.getByText('01'));
    await user.click(screen.getByText('01'));
    await waitFor(() =>
      screen.getByRole('button', { name: /Eliminar Pedido/ })
    );
    await user.click(screen.getByRole('button', { name: /Eliminar Pedido/ }));
    await waitFor(() => expect(deleteOrder).toHaveBeenCalledWith('order1'));
    confirmSpy.mockRestore();
  });
});
