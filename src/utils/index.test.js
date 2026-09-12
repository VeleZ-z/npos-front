import { describe, it, expect, vi, afterEach } from 'vitest';
import { getBgColor, getAvatarName, formatDate, formatDateAndTime } from './index';

describe('getBgColor', () => {
  it('devuelve un color de la paleta definida', () => {
    const color = getBgColor();
    expect(color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('respeta el rango del índice aleatorio', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(getBgColor()).toBe('#b73e3e');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
});

describe('getAvatarName', () => {
  it('devuelve las iniciales en mayúsculas', () => {
    expect(getAvatarName('Juan Perez')).toBe('JP');
    expect(getAvatarName('ana maria')).toBe('AM');
  });

  it('devuelve cadena vacía para nombre vacío', () => {
    expect(getAvatarName('')).toBe('');
    expect(getAvatarName(undefined)).toBe('');
    expect(getAvatarName(null)).toBe('');
  });
});

describe('formatDate', () => {
  it('formatea una fecha en el patrón Month DD, YYYY', () => {
    const d = new Date(2024, 0, 5); // 5 enero 2024
    expect(formatDate(d)).toBe('January 05, 2024');
  });
});

describe('formatDateAndTime', () => {
  it('devuelve un string no vacío para una fecha válida', () => {
    const out = formatDateAndTime(new Date(2024, 0, 5, 10, 30, 15));
    expect(typeof out).toBe('string');
    expect(out.length).toBeGreaterThan(0);
  });
});