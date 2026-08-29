import { test, expect } from '@playwright/test';

test('cart: add item -> open cart modal -> go to checkout', async ({ page }) => {
  // Start from the products catalog (local products, no backend needed)
  await page.goto('/productos');

  // Add first product
  await page.getByRole('button', { name: /añadir al carrito/i }).first().click();

  // Badge should show 1
  await expect(page.locator('span').filter({ hasText: /^1$/ }).first()).toBeVisible();

  // Open cart modal
  await page.getByRole('button', { name: /mi carrito/i }).click();

  await expect(page.getByRole('heading', { name: /carrito/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'HAG-PB5MP-VF-A', level: 4 })).toBeVisible();

  // Go to checkout
  await page.getByRole('button', { name: /pagar pedido/i }).click();

  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByRole('heading', { name: /contacto/i })).toBeVisible();
});
