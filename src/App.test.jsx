import { describe, it, expect, vi } from 'vitest';
import { screen, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { makeStore } from './test/test-utils';

vi.mock('./hooks/useLoadData', () => ({
  default: () => false,
}));
vi.mock('./components/shared/Header', () => ({
  default: () => <div data-testid="header" />,
}));
vi.mock('./components/auth/LoginModal', () => ({
  default: () => null,
}));

const auth = (role) =>
  makeStore({
    user: { _id: '1', name: 'Ana', email: 'a@b.c', phone: '', role, isAuth: true },
  });

function renderAppAt(store, path) {
  window.history.pushState({}, '', path);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <App />
      </QueryClientProvider>
    </Provider>
  );
}

describe('ProtectedRoutes (RBAC)', () => {
  it('Admin accede a /dashboard', () => {
    renderAppAt(auth('Admin'), '/dashboard');
    expect(screen.queryByText('Not Found')).toBeNull();
  });

  it('Cashier accede a /sales', () => {
    renderAppAt(auth('Cashier'), '/sales');
    expect(screen.queryByText('Not Found')).toBeNull();
  });

  it('Waiter es redirigido fuera de /dashboard (ruta admin)', () => {
    renderAppAt(auth('Waiter'), '/dashboard');
    expect(screen.queryByText('Not Found')).toBeNull();
  });

  it('Customer no ve rutas exclusivas de Admin (/admin/users)', () => {
    renderAppAt(auth('Customer'), '/admin/users');
    expect(screen.queryByText('Not Found')).toBeNull();
  });
});