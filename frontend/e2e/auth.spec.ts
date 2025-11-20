import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Authentication
 *
 * Prerequisites:
 * - Docker Compose running (docker compose up -d)
 *
 * Run:
 * - npm run test:e2e
 */

const TEST_USER = {
  email: 'e2e.test@example.com',
  password: 'senha123',
};

test.describe('Authentication Flow', () => {
  // Setup: Ensure test user exists
  test.beforeAll(async ({ request }) => {
    try {
      // Try to create test user
      await request.post('/api/auth/signup', {
        data: TEST_USER,
      });
    } catch (error: unknown) {
      // Only ignore if user already exists (400 Bad Request)
      // Any other error (500, network, etc.) should fail the test
      if (typeof error === 'object' && error !== null && 'status' in error && error.status !== 400) {
        throw error;
      }
    }
  });

  test('should login with credentials and access dashboard successfully', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Fill login form
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/senha/i).fill(TEST_USER.password);

    // Submit form
    await page.getByRole('button', { name: /entrar/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');

    // Should show user email in dashboard
    await expect(page.getByText(TEST_USER.email)).toBeVisible();

    // Should show dashboard content (chart and table)
    await expect(page.getByRole('heading', { name: /evolução de vendas/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /produtos/i })).toBeVisible();

    // Final verification: Confirm we're on the dashboard page
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });
});
