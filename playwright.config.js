/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  testDir: "./tests",
  timeout: 90_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  workers: 1,
  use: {
    headless: true,
    viewport: { width: 1440, height: 900 },
    launchOptions: {
      args: ["--autoplay-policy=no-user-gesture-required"],
    },
  },
  reporter: [["list"]],
};

module.exports = config;
