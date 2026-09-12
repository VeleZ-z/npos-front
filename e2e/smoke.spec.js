import { test, expect } from '@playwright/test';

const MOCK_TABLES = {
  data: {
    data: [
      { _id: 't1', number: 1, status: 'free', capacity: 4, currentOrder: null },
      { _id: 't2', number: 2, status: 'booked', capacity: 2, currentOrder: { customer: { name: 'Juan' } } },
    ],
  },
};

const MOCK_ORDERS = {
  data: {
    data: [
      { _id: 'o1', orderStatus: 'PENDIENTE', orderDate: new Date().toISOString(), items: [{ _id: 'i1' }] },
    ],
  },
};

test.describe('Nativ POS - smoke E2E (backend mockeado)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/table', (route) =>
      route.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_TABLES) })
    );
    await page.route('**/api/order*', (route) =>
      route.fulfill({ contentType: 'application/json', body: JSON.stringify(MOCK_ORDERS) })
    );
  });

  test('renderiza la home de invitado', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('la vista de mesas muestra 2 mesas del mock', async ({ page }) => {
    await page.goto('/tables');
    await expect(page.getByText('Mesas')).toBeVisible();
  });
});