import { describe, it, expect } from 'vitest';
import customerReducer, {
  setCustomer,
  removeCustomer,
  updateTable,
} from './customerSlice';

describe('customerSlice', () => {
  const initialState = {
    orderId: '',
    customerName: '',
    customerPhone: '',
    guests: 0,
    table: null,
  };

  it('setCustomer asigna datos y genera un orderId numérico', () => {
    const state = customerReducer(initialState, setCustomer({
      name: 'Juan', phone: '311', guests: 4,
    }));
    expect(state.customerName).toBe('Juan');
    expect(state.customerPhone).toBe('311');
    expect(state.guests).toBe(4);
    expect(state.orderId).not.toBe('');
  });

  it('removeCustomer limpia datos del cliente', () => {
    const withCustomer = customerReducer(initialState, setCustomer({
      name: 'Juan', phone: '311', guests: 4,
    }));
    const state = customerReducer(withCustomer, removeCustomer());
    expect(state.customerName).toBe('');
    expect(state.customerPhone).toBe('');
    expect(state.guests).toBe(0);
  });

  it('updateTable asigna la mesa', () => {
    const state = customerReducer(initialState, updateTable({ table: 3 }));
    expect(state.table).toBe(3);
  });
});