import { defineConfig } from '@playwright/test';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5173;

export default defineConfig({
  testDir: './tests/e2e',
  webServer: {
    command: `pnpm dev --port ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: `http://localhost:${PORT}`,
  },
});
