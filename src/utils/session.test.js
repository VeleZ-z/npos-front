import { describe, it, expect, afterEach, vi } from 'vitest';
import { isGuest } from './session';

describe('isGuest', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('retorna true cuando no hay token en localStorage', () => {
    localStorage.removeItem('token');
    expect(isGuest()).toBe(true);
  });

  it('retorna false cuando existe un token', () => {
    localStorage.setItem('token', 'jwt-token-123');
    expect(isGuest()).toBe(false);
  });

  it('retorna true cuando localStorage lanza una excepción', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(isGuest()).toBe(true);
  });
});