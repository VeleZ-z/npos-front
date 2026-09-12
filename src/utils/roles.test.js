import { describe, it, expect } from 'vitest';
import {
  ROLES,
  normalizeRole,
  isAdmin,
  isCashier,
  isWaiter,
  isCustomer,
  isStaff,
  isStaffOrWaiter,
  hasRole,
  getRoleLabel,
} from './roles';

describe('normalizeRole', () => {
  it('devuelve cadena vacía cuando no hay rol', () => {
    expect(normalizeRole(undefined)).toBe('');
    expect(normalizeRole(null)).toBe('');
    expect(normalizeRole('')).toBe('');
  });

  it('convierte el rol a minúsculas', () => {
    expect(normalizeRole('Admin')).toBe('admin');
    expect(normalizeRole('ADMIN')).toBe('admin');
    expect(normalizeRole('Cashier')).toBe('cashier');
  });

  it('normaliza valores no-string forzándolos a string', () => {
    expect(normalizeRole(123)).toBe('123');
  });
});

describe('ROLES', () => {
  it('expone los cuatro roles estándar', () => {
    expect(ROLES).toEqual({
      ADMIN: 'Admin',
      CASHIER: 'Cashier',
      WAITER: 'Waiter',
      CUSTOMER: 'Customer',
    });
  });
});

describe.each([
  ['isAdmin', isAdmin],
  ['isCashier', isCashier],
  ['isWaiter', isWaiter],
  ['isCustomer', isCustomer],
])('%s', (_name, fn) => {
  it('retorna false para rol vacío/null/undefined', () => {
    expect(fn(undefined)).toBe(false);
    expect(fn(null)).toBe(false);
    expect(fn('')).toBe(false);
  });

  it('es insensible a mayúsculas/minúsculas', () => {
    const role = _name === 'isAdmin' ? 'ADMIN' :
      _name === 'isCashier' ? 'CASHIER' :
      _name === 'isWaiter' ? 'WAITER' : 'CUSTOMER';
    expect(fn(role)).toBe(true);
  });
});

describe('isStaff', () => {
  it('admite admin y cashier', () => {
    expect(isStaff('Admin')).toBe(true);
    expect(isStaff('cashier')).toBe(true);
  });

  it('excluye waiter y customer', () => {
    expect(isStaff('waiter')).toBe(false);
    expect(isStaff('customer')).toBe(false);
  });

  it('retorna false para valores vacíos', () => {
    expect(isStaff(null)).toBe(false);
  });
});

describe('isStaffOrWaiter', () => {
  it('admite admin, cashier y waiter', () => {
    expect(isStaffOrWaiter('Admin')).toBe(true);
    expect(isStaffOrWaiter('Cashier')).toBe(true);
    expect(isStaffOrWaiter('Waiter')).toBe(true);
  });

  it('excluye customer', () => {
    expect(isStaffOrWaiter('Customer')).toBe(false);
  });
});

describe('hasRole', () => {
  it('permite todo cuando no se pasan roles permitidos', () => {
    expect(hasRole('admin', [])).toBe(true);
    expect(hasRole('admin', null)).toBe(true);
    expect(hasRole('admin', 'not-array')).toBe(true);
  });

  it('valida contra la lista permitida de forma insensible a mayúsculas', () => {
    expect(hasRole('Admin', ['admin', 'cashier'])).toBe(true);
    expect(hasRole('CASHIER', ['admin', 'cashier'])).toBe(true);
  });

  it('rechaza roles fuera de la lista permitida', () => {
    expect(hasRole('waiter', ['admin', 'cashier'])).toBe(false);
  });

  it('maneja rol vacío', () => {
    expect(hasRole('', ['admin'])).toBe(false);
    expect(hasRole(undefined, [])).toBe(true);
  });
});

describe('getRoleLabel', () => {
  it('traduce cada rol a su etiqueta en español', () => {
    expect(getRoleLabel('Admin')).toBe('Administrador');
    expect(getRoleLabel('Cashier')).toBe('Cajero');
    expect(getRoleLabel('Waiter')).toBe('Mesero');
    expect(getRoleLabel('Customer')).toBe('Cliente');
  });

  it('devuelve el rol original para valores desconocidos', () => {
    expect(getRoleLabel('Supervisor')).toBe('Supervisor');
  });

  it('devuelve guion largo para rol vacío', () => {
    expect(getRoleLabel(null)).toBe('—');
    expect(getRoleLabel('')).toBe('—');
  });
});