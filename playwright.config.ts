import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    headless: true, // 100% em segundo plano, sem abrir janelas
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'Mobile Pixel 5',
      use: {
        ...devices['Pixel 5'],
        headless: true,
      },
    },
    {
      name: 'Desktop Chromium',
      use: {
        viewport: { width: 1280, height: 800 },
        headless: true,
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 30000,
  },
});
