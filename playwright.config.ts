// Browser smoke tests (Phase 4.5): the production build in the installed Chrome, against a copy of library/.
import { defineConfig } from '@playwright/test';

const PORT = 4174;

export default defineConfig({
  testDir: 'e2e',
  // One worker: the tests share one reading position on the server, and each starts by resetting it.
  workers: 1,
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: 'chrome', // the installed Chrome; no browser download
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run build && tsx scripts/e2e-server.ts',
    url: `http://localhost:${PORT}/api/books`,
    env: { E2E_PORT: String(PORT) },
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
