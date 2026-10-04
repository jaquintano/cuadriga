import { defineConfig, devices } from '@playwright/test';

// Smoke test sobre el build de producción (con service worker), servido como en GitHub Pages.
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:4173/cuadriga/',
    ...devices['Pixel 7'],
    serviceWorkers: 'allow',
  },
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173/cuadriga/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
