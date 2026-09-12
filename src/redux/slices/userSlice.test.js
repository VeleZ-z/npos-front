import { describe, it, expect } from 'vitest';
import userReducer, { setUser, removeUser } from './userSlice';

describe('userSlice', () => {
  const initialState = {
    _id: '',
    name: '',
    email: '',
    phone: '',
    role: '',
    isAuth: false,
  };

  it('retorna estado inicial', () => {
    expect(userReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('setUser asigna payload y marca isAuth en true', () => {
    const state = userReducer(initialState, setUser({
      _id: '1', name: 'Ana', phone: '123', email: 'a@b.c', role: 'Admin',
    }));
    expect(state).toMatchObject({
      _id: '1', name: 'Ana', phone: '123', email: 'a@b.c', role: 'Admin', isAuth: true,
    });
  });

  it('removeUser resetea el estado y cierra sesión', () => {
    const logged = userReducer(initialState, setUser({
      _id: '1', name: 'Ana', phone: '123', email: 'a@b.c', role: 'Admin',
    }));
    expect(userReducer(logged, removeUser())).toEqual(initialState);
    expect(userReducer(logged, removeUser()).isAuth).toBe(false);
  });
});