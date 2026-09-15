import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { makeStore } from '../test/test-utils';

vi.mock('../https/index', () => ({
  getUserData: vi.fn(),
  getTodayStats: vi.fn(),
}));

import { getUserData, getTodayStats } from '../https/index';
import useLoadData from './useLoadData';
import { useTodayStats } from './useTodayStats';
import useHideBottomNav from './useHideBottomNav';

const queryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

const wrapper = ({ children }) => (
  <Provider store={makeStore()}>
    <QueryClientProvider client={queryClient()}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  </Provider>
);

afterEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('useLoadData', () => {
  it('carga al usuario y actualiza el store cuando hay token', async () => {
    localStorage.setItem('token', 'abc');
    getUserData.mockResolvedValue({
      data: { data: { _id: '1', name: 'Ana', email: 'a@a.co', phone: '1', role: 'admin' } },
    });
    const { result, unmount } = renderHook(() => useLoadData(), { wrapper });
    expect(result.current).toBe(true);
    await act(async () => {});
    unmount();
  });

  it('resetea el usuario cuando no hay token (guest)', async () => {
    const { result, unmount } = renderHook(() => useLoadData(), { wrapper });
    await act(async () => {});
    expect(result.current).toBe(false);
    unmount();
  });

  it('limpia el token y resetea el usuario cuando la petición falla', async () => {
    localStorage.setItem('token', 'bad');
    getUserData.mockRejectedValue(new Error('fail'));
    const { result, unmount } = renderHook(() => useLoadData(), { wrapper });
    await act(async () => {});
    expect(result.current).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
    unmount();
  });
});

describe('useTodayStats', () => {
  it('devuelve los datos de estadísticas del día', async () => {
    getTodayStats.mockResolvedValue({ data: { data: { total: 5 } } });
    const { result, unmount } = renderHook(() => useTodayStats(), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual({ total: 5 }));
    unmount();
  });

  it('devuelve null cuando no hay data', async () => {
    getTodayStats.mockResolvedValue({ data: { data: null } });
    const { result, unmount } = renderHook(() => useTodayStats(), { wrapper });
    await waitFor(() => expect(result.current.data).toBeNull());
    unmount();
  });
});

describe('useHideBottomNav', () => {
  it('oculta la barra cuando shouldHide devuelve true para no staff', () => {
    const store = makeStore({
      user: { role: 'customer', name: 'Cliente' },
    });
    document.body.innerHTML = '<div id="bottom-nav"></div>';
    const { unmount } = renderHook(
      () => useHideBottomNav(() => true),
      {
        wrapper: ({ children }) => (
          <Provider store={store}>
            <QueryClientProvider client={queryClient()}>
              <MemoryRouter>{children}</MemoryRouter>
            </QueryClientProvider>
          </Provider>
        ),
      }
    );
    expect(document.getElementById('bottom-nav').style.display).toBe('none');
    unmount();
  });

  it('no toca la barra para staff', () => {
    const store = makeStore({ user: { role: 'admin', name: 'Ana' } });
    document.body.innerHTML = '<div id="bottom-nav" style="display:block"></div>';
    const { unmount } = renderHook(() => useHideBottomNav(() => true), {
      wrapper: ({ children }) => (
        <Provider store={store}>
          <QueryClientProvider client={queryClient()}>
            <MemoryRouter>{children}</MemoryRouter>
          </QueryClientProvider>
        </Provider>
      ),
    });
    expect(document.getElementById('bottom-nav').style.display).toBe('block');
    unmount();
  });
});