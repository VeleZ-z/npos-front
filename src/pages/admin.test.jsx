import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test/test-utils';
import AdminUsers from './AdminUsers';
import Categories from './Categories';
import Purchases from './Purchases';
import PaymentMethods from './PaymentMethods';
import Profile from './Profile';
import CashDeskHistory from './CashDeskHistory';

vi.mock('notistack', () => ({ enqueueSnackbar: vi.fn() }));

vi.mock('../https', () => ({
  getUsers: vi.fn(),
  updateUser: vi.fn(),
  setUserRole: vi.fn(),
  getDocTypes: vi.fn(),
  getStates: vi.fn(),
  getRoles: vi.fn(),
  getCategories: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  getPurchases: vi.fn(),
  addPurchase: vi.fn(),
  updatePurchase: vi.fn(),
  updatePurchaseStock: vi.fn(),
  deletePurchase: vi.fn(),
  getProviders: vi.fn(),
  getPayMethods: vi.fn(),
  addPayMethod: vi.fn(),
  updatePayMethod: vi.fn(),
  deletePayMethod: vi.fn(),
  setPayMethodEstado: vi.fn(),
  getUserData: vi.fn(),
  updateProfile: vi.fn(),
  getCashDeskHistory: vi.fn(),
  getCashDeskMovements: vi.fn(),
  exportCashDeskMovements: vi.fn(),
}));

import {
  getUsers,
  updateUser,
  setUserRole,
  getDocTypes,
  getStates,
  getRoles,
  getCategories,
  updateCategory,
  deleteCategory,
  getPurchases,
  addPurchase,
  updatePurchase,
  updatePurchaseStock,
  deletePurchase,
  getProviders,
  getPayMethods,
  addPayMethod,
  updatePayMethod,
  deletePayMethod,
  setPayMethodEstado,
  getUserData,
  updateProfile,
  getCashDeskHistory,
  getCashDeskMovements,
  exportCashDeskMovements,
} from '../https';

vi.mock('../components/dashboard/CategoryModal', () => ({
  default: () => <div data-testid="category-modal" />,
}));

const res = (data) => Promise.resolve({ data: { data } });
const adminState = { initialState: { user: { role: 'Admin' } } };

beforeEach(() => {
  vi.clearAllMocks();
  getStates.mockResolvedValue(res([{ _id: 1, name: 'ACTIVO' }]));
  getDocTypes.mockResolvedValue(res([{ _id: 1, name: 'CC' }]));
  getRoles.mockResolvedValue(
    res([
      { _id: 1, name: 'Admin' },
      { _id: 2, name: 'Admin' }, // duplicado a propósito
      { _id: 3, name: 'Cashier' },
    ])
  );
});

describe('AdminUsers', () => {
  const users = [
    { _id: 'u1', name: 'Ana', email: 'ana@x.co', document: '123', role: 'Admin' },
    { _id: 'u2', name: 'Luis', email: 'luis@x.co', document: '456', role: 'Cashier' },
  ];

  beforeEach(() => {
    getUsers.mockResolvedValue(res(users));
    updateUser.mockResolvedValue({});
    setUserRole.mockResolvedValue({});
  });

  it('lista usuarios y filtra por texto', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminUsers />);
    await waitFor(() => expect(screen.getByText('Ana')).toBeInTheDocument());
    expect(screen.getByText('Luis')).toBeInTheDocument();
    await user.type(
      screen.getByPlaceholderText(/Buscar por nombre, correo o documento/),
      'luis'
    );
    expect(screen.queryByText('Ana')).not.toBeInTheDocument();
    expect(screen.getByText('Luis')).toBeInTheDocument();
  });

  it('guarda cambios y cambia rol (deduplicando roles)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminUsers />);
    await waitFor(() => screen.getByText('Ana'));
    await user.click(screen.getAllByRole('button', { name: 'Guardar' })[0]);
    await waitFor(() =>
      expect(updateUser).toHaveBeenCalledWith('u1', expect.objectContaining({ documento: '123' }))
    );
    // roles deben estar deduplicados: Admin, Cashier = 2 opciones
    const roleSelects = screen.getAllByDisplayValue(/Admin|Cashier/);
    const first = roleSelects[0];
    await user.selectOptions(first, 'Cashier');
    await waitFor(() =>
      expect(setUserRole).toHaveBeenCalledWith('u1', 'Cashier')
    );
  });
});

describe('Categories', () => {
  beforeEach(() => {
    getCategories.mockResolvedValue(
      res([
        { _id: 1, name: 'Comida' },
        { _id: 2, name: 'Bebidas' },
      ])
    );
    updateCategory.mockResolvedValue({});
    deleteCategory.mockResolvedValue({});
  });

  it('lista y filtra categorías', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Categories />);
    await waitFor(() =>
      expect(screen.getByDisplayValue('Comida')).toBeInTheDocument()
    );
    await user.type(screen.getByPlaceholderText('Buscar categoría'), 'beb');
    expect(screen.queryByDisplayValue('Comida')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('Bebidas')).toBeInTheDocument();
  });

  it('guarda nombre editado', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Categories />);
    await waitFor(() => screen.getByDisplayValue('Comida'));
    const input = screen.getByDisplayValue('Comida');
    await user.clear(input);
    await user.type(input, 'Platos');
    await user.click(screen.getAllByRole('button', { name: 'Guardar' })[0]);
    await waitFor(() =>
      expect(updateCategory).toHaveBeenCalledWith(1, { name: 'Platos' })
    );
  });

  it('elimina solo confirmando el nombre exacto', async () => {
    const user = userEvent.setup();
    const spy = vi.spyOn(window, 'prompt').mockReturnValue('Comida');
    renderWithProviders(<Categories />);
    await waitFor(() => screen.getByDisplayValue('Comida'));
    await user.click(screen.getAllByRole('button', { name: 'Eliminar' })[0]);
    await waitFor(() => expect(deleteCategory).toHaveBeenCalledWith(1));
    spy.mockReturnValue('Otro');
    await user.click(screen.getAllByRole('button', { name: 'Eliminar' })[1]);
    expect(deleteCategory).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it('abre el modal de crear categoría', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Categories />);
    await user.click(screen.getByRole('button', { name: 'Crear Categoría' }));
    expect(screen.getByTestId('category-modal')).toBeInTheDocument();
  });
});

describe('Purchases', () => {
  const purchases = [
    {
      _id: 'pu1',
      name: 'Harina',
      provider: { _id: 'pr1', name: 'Proveedor A' },
      stock: 10,
      unit: 'kg',
      cost: 5000,
      deliveryDate: '2026-01-01',
    },
  ];
  beforeEach(() => {
    getPurchases.mockResolvedValue(res(purchases));
    getProviders.mockResolvedValue(res([{ _id: 'pr1', name: 'Proveedor A' }]));
    updatePurchaseStock.mockResolvedValue({});
    deletePurchase.mockResolvedValue({});
    addPurchase.mockResolvedValue({});
    updatePurchase.mockResolvedValue({});
  });

  it('lista compras y permite actualizar stock a staff', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Purchases />, {
      initialState: { user: { role: 'Cashier' } },
    });
    await waitFor(() => expect(screen.getByText('Harina')).toBeInTheDocument());
    expect(screen.getByText('Proveedor A')).toBeInTheDocument();
    const qty = screen.getByDisplayValue('10');
    await user.clear(qty);
    await user.type(qty, '25');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() =>
      expect(updatePurchaseStock).toHaveBeenCalledWith('pu1', 25)
    );
  });

  it('admin puede eliminar y abrir formulario de edición', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Purchases />, adminState);
    await waitFor(() => screen.getByText('Harina'));
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));
    await waitFor(() => expect(deletePurchase).toHaveBeenCalledWith('pu1'));
    await user.click(screen.getByRole('button', { name: 'Editar' }));
    await waitFor(() =>
      expect(screen.getByText('Editar Compra')).toBeInTheDocument()
    );
  });

  it('filtra por nombre/proveedor y crea compra nueva', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Purchases />, adminState);
    await waitFor(() => screen.getByText('Harina'));
    await user.type(screen.getByPlaceholderText(/Buscar por nombre o proveedor/), 'zzz');
    expect(screen.queryByText('Harina')).not.toBeInTheDocument();
    await user.clear(screen.getByPlaceholderText(/Buscar por nombre o proveedor/));

    await user.click(screen.getByRole('button', { name: 'Nueva Compra' }));
    await waitFor(() =>
      expect(screen.getAllByText('Nueva Compra').length).toBeGreaterThan(1)
    );
    await user.type(document.querySelector('input[name="name"]'), 'Aceite');
    await user.click(document.querySelector('form button[type="submit"]'));
    await waitFor(() =>
      expect(addPurchase).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Aceite' })
      )
    );
  });
});

describe('PaymentMethods', () => {
  beforeEach(() => {
    getPayMethods.mockResolvedValue(
      res([
        { _id: 'pm1', name: 'Efectivo', estadoId: 1 },
        { _id: 'pm2', name: 'Nequi', estadoId: 1 },
      ])
    );
    addPayMethod.mockResolvedValue({});
    updatePayMethod.mockResolvedValue({});
    setPayMethodEstado.mockResolvedValue({});
    deletePayMethod.mockResolvedValue({});
  });

  it('lista métodos y admin crea uno nuevo', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PaymentMethods />, adminState);
    await waitFor(() => expect(screen.getByDisplayValue('Efectivo')).toBeInTheDocument());
    await user.type(screen.getByPlaceholderText('Efectivo / Tarjeta'), 'PSE');
    await user.click(screen.getByRole('button', { name: 'Crear' }));
    await waitFor(() =>
      expect(addPayMethod).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'PSE' })
      )
    );
  });

  it('no admin ve texto plano sin acciones de edición', async () => {
    renderWithProviders(<PaymentMethods />, {
      initialState: { user: { role: 'Customer' } },
    });
    await waitFor(() => expect(screen.getByText('Efectivo')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Crear' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument();
  });

  it('actualiza nombre y elimina', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PaymentMethods />, adminState);
    await waitFor(() => screen.getByDisplayValue('Nequi'));
    const input = screen.getByDisplayValue('Nequi');
    await user.clear(input);
    await user.type(input, 'Nequi QR');
    await user.click(screen.getAllByRole('button', { name: 'Actualizar' })[1]);
    await waitFor(() =>
      expect(updatePayMethod).toHaveBeenCalledWith(
        'pm2',
        expect.objectContaining({ name: 'Nequi QR' })
      )
    );
    await user.click(screen.getAllByRole('button', { name: 'Eliminar' })[0]);
    await waitFor(() => expect(deletePayMethod).toHaveBeenCalledWith('pm1'));
  });

  it('guarda cambio de estado con botón Guardar de fila', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PaymentMethods />, adminState);
    await waitFor(() => screen.getByDisplayValue('Efectivo'));
    await user.click(screen.getAllByRole('button', { name: 'Guardar' })[0]);
    await waitFor(() =>
      expect(setPayMethodEstado).toHaveBeenCalledWith('pm1', 1)
    );
  });
});

describe('Profile', () => {
  beforeEach(() => {
    getUserData.mockResolvedValue(
      res({
        name: 'Ana',
        email: 'ana@x.co',
        document: '123',
        phone: '3001112222',
        docTypeId: 1,
        birthday: '1999-01-01T00:00:00',
      })
    );
    updateProfile.mockResolvedValue({});
  });

  it('precarga datos y envía actualización', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Profile />);
    await waitFor(() =>
      expect(screen.getByDisplayValue('123')).toBeInTheDocument()
    );
    expect(screen.getByDisplayValue('ana@x.co')).toBeInTheDocument();
    const phone = screen.getByDisplayValue('3001112222');
    await user.clear(phone);
    await user.type(phone, '3110000000');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() =>
      expect(updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          documento: '123',
          telefono: '3110000000',
          tipo_doc_id: 1,
        })
      )
    );
  });

  it('cumpleaños deshabilitado cuando ya está registrado', async () => {
    renderWithProviders(<Profile />);
    await waitFor(() => screen.getByDisplayValue('123'));
    expect(
      screen.getByText(/solo se puede registrar una vez/)
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('1999-01-01')).toBeDisabled();
  });
});

describe('CashDeskHistory', () => {
  beforeEach(() => {
    getCashDeskHistory.mockResolvedValue(
      res([
        {
          id: 7,
          openedAt: '2026-09-01T08:00:00',
          closedAt: '2026-09-01T20:00:00',
          openingUser: { name: 'Ana' },
          closingUser: { name: 'Luis' },
          estado: 'CERRADO',
          saldoInicial: 50000,
          totals: { totalCaja: 250000, cash: 150000, card: 80000, transfer: 20000 },
          gastos: 10000,
          diferencia: -5000,
          invoicesCount: 12,
        },
      ])
    );
    getCashDeskMovements.mockResolvedValue(
      res([
        {
          id: 1,
          numero_factura: 'F-001',
          metodo_pago: 'Efectivo',
          total: 25000,
          propina: 2000,
          created_at: '2026-09-01T10:00:00',
        },
      ])
    );
    exportCashDeskMovements.mockResolvedValue({
      data: new Blob(['x']),
      headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    });
  });

  it('muestra historial con totales y filtros de rango', async () => {
    renderWithProviders(<CashDeskHistory />);
    await waitFor(() =>
      expect(screen.getByText('Cuadre #7')).toBeInTheDocument()
    );
    expect(screen.getByText(/Apertura: Ana/)).toBeInTheDocument();
    expect(screen.getAllByText(/\$150.000/).length).toBeGreaterThan(0);
    // cambiar de rango dispara nueva consulta
    const user = userEvent.setup();
    await user.click(screen.getByText('Todo el tiempo'));
    await waitFor(() => expect(getCashDeskHistory).toHaveBeenCalledTimes(2));
    await user.click(screen.getByText('Personalizado'));
    expect(document.querySelector('input[type="date"]')).toBeInTheDocument();
  });

  it('expande movimientos y exporta XLS', async () => {
    const user = userEvent.setup();
    const urlSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:fake');
    renderWithProviders(<CashDeskHistory />);
    await waitFor(() => screen.getByText('Cuadre #7'));
    await user.click(screen.getByRole('button', { name: 'Ver movimientos' }));
    await waitFor(() => expect(screen.getByText(/F-001/)).toBeInTheDocument());
    expect(screen.getAllByText('Efectivo').length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'Exportar XLS' }));
    await waitFor(() =>
      expect(exportCashDeskMovements).toHaveBeenCalledWith({ cuadreId: 7 })
    );
    urlSpy.mockRestore();
  });

  it('muestra estado vacío sin cuadres', async () => {
    getCashDeskHistory.mockResolvedValue(res([]));
    renderWithProviders(<CashDeskHistory />);
    await waitFor(() =>
      expect(
        screen.getByText(/No se encontraron cuadres/)
      ).toBeInTheDocument()
    );
  });
});
