import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 2 : 2,
  timeout: 45000,
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
    ...(!process.env.CI
      ? [
          {
            name: 'Mobile Galaxy S20 (360x800)',
            use: {
              ...devices['Pixel 5'],
              viewport: { width: 360, height: 800 },
              isMobile: true,
              hasTouch: true,
              deviceScaleFactor: 3,
              headless: true,
            },
          },
          {
            name: 'Mobile Compact (320x640)',
            use: {
              ...devices['Pixel 5'],
              viewport: { width: 320, height: 640 },
              isMobile: true,
              hasTouch: true,
              deviceScaleFactor: 2,
              headless: true,
            },
          },
        ]
      : []),
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 30000,
  },
});
