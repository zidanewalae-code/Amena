// Playwright config for Sprint 6 web e2e checks.
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  retries: 0,
  use: {
    baseURL: process.env.WEB_BASE_URL || 'http://localhost:3000'
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { viewport: { width: 1366, height: 900 } }
    },
    {
      name: 'tablet-webview',
      use: {
        viewport: { width: 834, height: 1194 },
        userAgent:
          'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
      }
    },
    {
      name: 'mobile-webview',
      use: {
        viewport: { width: 390, height: 844 },
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
      }
    }
  ]
});
