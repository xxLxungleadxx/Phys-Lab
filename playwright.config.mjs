import { defineConfig } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.join(path.dirname(fileURLToPath(import.meta.url)), ".playwright-browsers");

const sizes = [
  ["desktop", 1440, 900], ["tablet-landscape", 1024, 768],
  ["tablet-portrait", 768, 1024], ["phone-portrait", 390, 844],
  ["phone-landscape", 844, 390]
];

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: true,
  workers: 2,
  timeout: 60000,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  outputDir: "test-results",
  reporter: [
    ["list"], ["html", { outputFolder: "playwright-report", open: "never" }],
    ["json", { outputFile: "playwright-report/results.json" }]
  ],
  use: {
    baseURL: "http://127.0.0.1:4173/Phys-Lab/",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  projects: ["chromium", "firefox", "webkit"].flatMap(browserName =>
    sizes.map(([size, width, height]) => ({
      name: browserName + "-" + size,
      use: { browserName, viewport: { width, height }, hasTouch: browserName !== "firefox" && size !== "desktop" }
    }))
  ),
  webServer: {
    command: "npm run serve:test",
    url: "http://127.0.0.1:4173/Phys-Lab/",
    reuseExistingServer: false,
    timeout: 15000
  }
});
