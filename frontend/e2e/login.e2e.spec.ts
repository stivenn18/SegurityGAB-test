import { test, expect } from '@playwright/test';

test('login: admin -> redirects to admin dashboard', async ({ page }) => {
  // Mock backend responses used by login + admin dashboard
  await page.route('**/auth/login', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'e2e-token',
        user: { name: 'Admin', email: 'admin@example.com', role: 'admin' },
      }),
    });
  });

  await page.route('**/admin/users', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.route('**/products', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.goto('/login');

  await page.getByPlaceholder('Email').fill('admin@example.com');
  await page.getByPlaceholder('Contraseña').fill('secret');
  await page.getByRole('button', { name: /iniciar sesión/i }).click();

  await expect(page).toHaveURL(/\/dashboard\/admin$/);
  await expect(page.getByRole('heading', { name: /panel de administración/i })).toBeVisible();

  // Token should be stored
  const token = await page.evaluate(() => localStorage.getItem('token'));
  expect(token).toBe('e2e-token');
});
