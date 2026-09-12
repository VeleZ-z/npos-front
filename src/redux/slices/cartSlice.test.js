import { describe, it, expect } from 'vitest';
import cartReducer, {
  addItems,
  removeItem,
  removeAllItems,
  updateItemNote,
  getTotalPrice,
} from './cartSlice';

describe('cartSlice', () => {
  it('addItems agrega un item al carrito', () => {
    const state = cartReducer([], addItems({ id: 1, name: 'Pizza', price: 10 }));
    expect(state).toHaveLength(1);
    expect(state[0].name).toBe('Pizza');
  });

  it('removeItem elimina por id', () => {
    let state = [{ id: 1 }, { id: 2 }];
    state = cartReducer(state, removeItem(1));
    expect(state).toEqual([{ id: 2 }]);
  });

  it('removeAllItems vacía el carrito', () => {
    const state = cartReducer([{ id: 1 }, { id: 2 }], removeAllItems());
    expect(state).toEqual([]);
  });

  it('updateItemNote modifica la nota de un item existente', () => {
    let state = [{ id: 1, note: '' }];
    state = cartReducer(state, updateItemNote({ id: 1, note: 'sin cebolla' }));
    expect(state[0].note).toBe('sin cebolla');
  });

  it('updateItemNote no hace nada si el item no existe', () => {
    let state = [{ id: 1, note: '' }];
    state = cartReducer(state, updateItemNote({ id: 99, note: 'x' }));
    expect(state[0].note).toBe('');
  });

  it('getTotalPrice suma los precios', () => {
    const total = getTotalPrice({
      cart: [{ price: 10 }, { price: 20 }, { price: 5 }],
    });
    expect(total).toBe(35);
  });
});