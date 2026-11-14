import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/fixtures/global-setup.ts",
  workers: 1,
  use: { ...devices["Desktop Chrome"], trace: "retain-on-failure" },
  projects: [{ name: "chromium" }],
});
