import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E tests
 *
 * Prerequisites:
 * - Docker Compose must be running (backend, frontend, db)
 * - Run: docker compose up -d
 *
 * Usage:
 * - npm run test:e2e       # Run tests headless
 * - npm run test:e2e:ui    # Open Playwright UI
 */
export default defineConfig({
  // Test directory
  testDir: './e2e',

  // Run tests in parallel
  fullyParallel: true,

  // Fail build on CI if tests were accidentally left only/skip
  forbidOnly: !!process.env.CI,

  // Retry failed tests on CI
  retries: process.env.CI ? 2 : 0,

  // Number of workers (parallel tests)
  workers: process.env.CI ? 1 : undefined,

  // Reporter
  reporter: 'html',

  use: {
    // Base URL for all tests (Docker Compose frontend)
    baseURL: 'http://localhost:5173',

    // Collect trace on first retry
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Headless mode (no browser window)
    headless: true,
  },

  // Browser projects
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Don't start a dev server (Docker Compose is already running)
  // If you want Playwright to start the server:
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:5173',
  //   reuseExistingServer: !process.env.CI,
  // },
});
