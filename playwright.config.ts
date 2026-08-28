import { defineConfig, devices } from "@playwright/test";

// E2E tests drive the real app through a browser (human-click workflows), served
// by `next start` on :3100 with the seeded database. Mobile viewport (393px)
// matches the Figma design width and the layouts we verify (2-up desserts, 5-up
// cocktails, 3-up compact drinks).
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    viewport: { width: 393, height: 850 },
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "PORT=3100 npm run start",
    url: "http://127.0.0.1:3100/tr/terrace",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
