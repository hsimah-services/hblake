import { defineConfig, devices } from '@playwright/test';

import { BASE_URL } from './lib/env.ts';

// Projects run in order against one stack started by scripts/acceptance/up:
//   static  reads the repository; needs no server
//   fresh   asserts the empty site, so it must see the database before anything is created
//   api     GraphQL and HTTP contract
//   ui      browser checks of the public site and administration
// One worker: tests share the database, and list/order assertions assume no
// concurrent writers.
export default defineConfig({
  testDir: 'specs',
  fullyParallel: false,
  workers: 1,
  forbidOnly: true,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'static', testDir: 'specs/static' },
    { name: 'fresh', testDir: 'specs/fresh', use: { ...devices['Desktop Chrome'] } },
    { name: 'api', testDir: 'specs/api', dependencies: ['fresh'] },
    { name: 'ui', testDir: 'specs/ui', dependencies: ['api'], use: { ...devices['Desktop Chrome'] } },
  ],
});
