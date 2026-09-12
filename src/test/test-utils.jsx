import PropTypes from 'prop-types';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import userReducer from '../redux/slices/userSlice';
import customerReducer from '../redux/slices/customerSlice';
import cartReducer from '../redux/slices/cartSlice';

export function makeStore(initial = {}) {
  return configureStore({
    reducer: {
      user: userReducer,
      customer: customerReducer,
      cart: cartReducer,
    },
    preloadedState: initial,
  });
}

export function renderWithProviders(
  ui,
  { initialState = {}, route = '/', store = makeStore(initialState) } = {}
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const Wrapper = ({ children }) => (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );

  Wrapper.propTypes = {
    children: PropTypes.node,
  };

  return render(ui, { wrapper: Wrapper });
}