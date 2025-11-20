import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Authentication
 *
 * Prerequisites:
 * - Docker Compose running (docker compose up -d)
 * - User already created: teste.e2e@example.com / senha123
 *
 * Run:
 * - npm run test:e2e
 */

test.describe('Authentication Flow', () => {
  test('should login with email and password', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Fill login form
    await page.getByLabel(/email/i).fill('teste.e2e@example.com');
    await page.getByLabel(/senha/i).fill('senha123');

    // Submit form
    await page.getByRole('button', { name: /entrar/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');

    // Should show user email in dashboard
    await expect(page.getByText('teste.e2e@example.com')).toBeVisible();

    // Should show dashboard content (chart and table)
    await expect(page.getByRole('heading', { name: /evolução de vendas/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /produtos/i })).toBeVisible();
  });
});
