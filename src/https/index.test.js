import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '../test/server';
import { http, HttpResponse } from 'msw';
import * as api from './index';

const BASE = 'http://localhost:4000';

function expectData(data) {
  return () => new HttpResponse(JSON.stringify({ data }), { status: 200 });
}

describe('https/index - composición de endpoints', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it('googleLogin hace POST a google-login con credential y state', async () => {
    server.use(
      http.post(`${BASE}/api/user/google-login`, expectData({ ok: true }))
    );
    const res = await api.googleLogin('cred', 'state-1');
    expect(res.data.data).toEqual({ ok: true });
  });

  it('getUserData obtiene el usuario', async () => {
    server.use(http.get(`${BASE}/api/user`, expectData({ id: 1 })));
    const res = await api.getUserData();
    expect(res.data.data).toEqual({ id: 1 });
  });

  it('logout hace POST a /api/user/logout', async () => {
    server.use(http.post(`${BASE}/api/user/logout`, expectData({ ok: true })));
    const res = await api.logout();
    expect(res.data.data).toEqual({ ok: true });
  });

  it('updateProfile hace PUT al perfil', async () => {
    server.use(http.put(`${BASE}/api/user/profile`, expectData({ ok: true })));
    const res = await api.updateProfile({ name: 'Ana' });
    expect(res.data.data).toEqual({ ok: true });
  });

  it('getTables obtiene mesas', async () => {
    server.use(http.get(`${BASE}/api/table`, expectData([{ _id: 't1' }])));
    const res = await api.getTables();
    expect(res.data.data).toEqual([{ _id: 't1' }]);
  });

  it('updateTable hace PUT a /api/table/:id separando el id', async () => {
    server.use(http.put(`${BASE}/api/table/t1`, expectData({ ok: true })));
    const res = await api.updateTable({ tableId: 't1', number: 5 });
    expect(res.data.data).toEqual({ ok: true });
  });

  it('getOrders obtiene ordenes', async () => {
    server.use(http.get(`${BASE}/api/order`, expectData([])));
    const res = await api.getOrders();
    expect(res.data.data).toEqual([]);
  });

  it('updateOrderStatus hace PUT a /api/order/:id', async () => {
    server.use(http.put(`${BASE}/api/order/o1`, expectData({ ok: true })));
    const res = await api.updateOrderStatus({
      orderId: 'o1',
      orderStatus: 'PAGADO',
      tableId: 't1',
    });
    expect(res.data.data).toEqual({ ok: true });
  });

  it('getCategories obtiene categorías', async () => {
    server.use(http.get(`${BASE}/api/category`, expectData([])));
    const res = await api.getCategories();
    expect(res.data.data).toEqual([]);
  });

  it('getProducts obtiene productos', async () => {
    server.use(http.get(`${BASE}/api/product`, expectData([])));
    const res = await api.getProducts();
    expect(res.data.data).toEqual([]);
  });

  it('updateProductStockState hace PATCH', async () => {
    server.use(
      http.patch(`${BASE}/api/product/p1/stock-state`, expectData({ ok: true }))
    );
    const res = await api.updateProductStockState('p1', { estado_id: 2 });
    expect(res.data.data).toEqual({ ok: true });
  });

  it('getTaxes obtiene impuestos', async () => {
    server.use(http.get(`${BASE}/api/tax`, expectData([])));
    const res = await api.getTaxes();
    expect(res.data.data).toEqual([]);
  });

  it('getStates envía el tipo como query param', async () => {
    server.use(http.get(`${BASE}/api/state`, expectData([])));
    const res = await api.getStates(3);
    expect(res.data.data).toEqual([]);
  });

  it('getProviders obtiene proveedores', async () => {
    server.use(http.get(`${BASE}/api/provider`, expectData([])));
    const res = await api.getProviders();
    expect(res.data.data).toEqual([]);
  });

  it('getPurchases obtiene compras', async () => {
    server.use(http.get(`${BASE}/api/purchase`, expectData([])));
    const res = await api.getPurchases();
    expect(res.data.data).toEqual([]);
  });

  it('getUsers obtiene usuarios', async () => {
    server.use(http.get(`${BASE}/api/user/all`, expectData([])));
    const res = await api.getUsers();
    expect(res.data.data).toEqual([]);
  });

  it('getRoles obtiene roles', async () => {
    server.use(http.get(`${BASE}/api/user/roles`, expectData([])));
    const res = await api.getRoles();
    expect(res.data.data).toEqual([]);
  });

  it('getPayMethods obtiene métodos de pago', async () => {
    server.use(http.get(`${BASE}/api/paymethod`, expectData([])));
    const res = await api.getPayMethods();
    expect(res.data.data).toEqual([]);
  });

  it('getTodayStats obtiene estadísticas', async () => {
    server.use(http.get(`${BASE}/api/stats/today`, expectData({ total: 5 })));
    const res = await api.getTodayStats();
    expect(res.data.data).toEqual({ total: 5 });
  });

  it('getCashDeskMovements obtiene movimientos', async () => {
    server.use(http.get(`${BASE}/api/cash-desk/movements`, expectData([])));
    const res = await api.getCashDeskMovements({ page: 1 });
    expect(res.data.data).toEqual([]);
  });

  it('getCashDeskHistory obtiene historial', async () => {
    server.use(http.get(`${BASE}/api/cash-desk/history`, expectData([])));
    const res = await api.getCashDeskHistory({ page: 1 });
    expect(res.data.data).toEqual([]);
  });
});