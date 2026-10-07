import { defineConfig, devices } from '@playwright/test';

const PORT = 3010;
const BASE_URL = `http://localhost:${PORT}/apps/resume-analyzer/`;
const ENGINE_PORT = 3019;

/**
 * End-to-end tests run against a production build (`pnpm build` first) with a migrated and
 * seeded database, and a test double of the analysis engine that answers the documented job
 * API. Locally an already running dev server is reused.
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      command: 'pnpm exec tsx tests/support/analysis-engine-server.ts',
      port: ENGINE_PORT,
      env: { PORT: String(ENGINE_PORT) },
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm start',
      url: BASE_URL,
      env: { ANALYSIS_ENGINE_URL: `http://127.0.0.1:${ENGINE_PORT}` },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
