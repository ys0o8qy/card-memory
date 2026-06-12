import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/ui",
  outputDir: "./test-results/playwright",
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:8765",
    channel: process.env.PLAYWRIGHT_CHANNEL ?? "msedge",
    launchOptions: {
      args: [
        "--disable-sync",
        "--no-default-browser-check",
        "--no-first-run",
      ],
    },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: "npm run dev -- --port 8765",
    reuseExistingServer: true,
    timeout: 120_000,
    url: "http://127.0.0.1:8765",
  },
});
