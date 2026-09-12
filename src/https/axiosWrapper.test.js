import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.stubGlobal('import.meta', { env: { VITE_BACKEND_URL: 'http://localhost:4000' } });

import { axiosWrapper } from './axiosWrapper';

describe('axiosWrapper request interceptor', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('agrega Bearer cuando hay token en localStorage', () => {
    localStorage.setItem('token', 'abc');
    const config = { headers: {} };
    const result = axiosWrapper.interceptors.request.handlers[0].fulfilled(config);
    expect(result.headers.Authorization).toBe('Bearer abc');
  });

  it('elimina Authorization previa cuando no hay token', () => {
    const config = { headers: { Authorization: 'Bearer old' } };
    const result = axiosWrapper.interceptors.request.handlers[0].fulfilled(config);
    expect(result.headers.Authorization).toBeUndefined();
  });
});