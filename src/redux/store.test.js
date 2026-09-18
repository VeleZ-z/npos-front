import { describe, it, expect } from 'vitest';
import store from './store';

describe('store', () => {
  it('configura los tres slices con estado inicial', () => {
    const state = store.getState();
    expect(state).toHaveProperty('customer');
    expect(state).toHaveProperty('cart');
    expect(state).toHaveProperty('user');
    expect(state.cart).toEqual([]);
    expect(state.customer).toBeDefined();
    expect(state.user).toBeDefined();
  });

  it('despacha acciones de los slices normalmente', () => {
    store.dispatch({
      type: 'cart/addItems',
      payload: { id: 'x1', name: 'Pizza', quantity: 1, price: 1000 },
    });
    expect(store.getState().cart).toHaveLength(1);
    store.dispatch({ type: 'cart/removeAllItems' });
    expect(store.getState().cart).toEqual([]);
  });
});
