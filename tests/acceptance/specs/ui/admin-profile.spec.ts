import { expect, test } from '@playwright/test';

import { Api } from '../../lib/api.ts';
import { OPERATOR } from '../../lib/env.ts';
import { announcedError, confirmation, forbiddenControls, signIn } from '../../lib/ui.ts';

// The operator profile screens (ui/admin.yml User: detail and edit of displayName and
// email only). Each test restores the profile through the API.

const RESTORE = `mutation Restore($input: UpdateAdminUserInput!) { updateAdminUser(input: $input) { adminUser { id } } }`;

let api: Api;
let id: string;

test.beforeAll(async () => {
  api = await Api.operator();
  id = (await api.viewer())!.id;
});

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test.afterEach(async () => {
  await api.graphql(RESTORE, { input: { id, email: OPERATOR.email, displayName: OPERATOR.displayName } });
});

test.afterAll(async () => {
  await api.dispose();
});

const detail = (): string => `/admin/users/${encodeURIComponent(id)}`;

test('the profile detail shows identity and read-only role and status', async ({ page }) => {
  await page.goto(detail());
  const main = page.getByRole('main');
  await expect(main.getByText(OPERATOR.displayName).first()).toBeVisible();
  await expect(main.getByText(OPERATOR.email.toLowerCase()).first()).toBeVisible();
  await expect(main.getByText(/admin/i).first()).toBeVisible();
  await expect(main.getByText(/active/i).first()).toBeVisible();
  await expect(page.getByRole('textbox')).toHaveCount(0);
});

test('the profile form edits only display name and email', async ({ page }) => {
  await page.goto(`${detail()}/edit`);
  await expect(page.getByLabel('Display name')).toHaveValue(OPERATOR.displayName);
  await expect(page.getByLabel('Email')).toHaveValue(OPERATOR.email.toLowerCase());
  await expect(forbiddenControls(page)).toHaveCount(0);
  await expect(page.getByLabel(/password/i)).toHaveCount(0);
});

test('saving a new display name updates the profile', async ({ page }) => {
  await page.goto(`${detail()}/edit`);
  await page.getByLabel('Display name').fill('Profile Edited');
  await page.getByRole('button', { name: /^save/i }).click();
  await expect(confirmation(page)).toBeVisible();
  await expect.poll(async () => (await api.viewer())?.displayName).toBe('Profile Edited');
});

test('a blank display name is refused with an announced error and input kept', async ({ page }) => {
  await page.goto(`${detail()}/edit`);
  await page.getByLabel('Display name').fill('   ');
  await page.getByLabel('Email').fill(OPERATOR.email);
  await page.getByRole('button', { name: /^save/i }).click();
  await expect(announcedError(page).first()).toBeVisible();
  await expect(page.getByLabel('Display name')).toHaveAttribute('aria-invalid', 'true');
  expect((await api.viewer())?.displayName).toBe(OPERATOR.displayName);
});

test('the admin home links to the profile', async ({ page }) => {
  await page.goto('/admin');
  await page.locator(`a[href="${detail()}"], a[href="/admin/users/${id}"]`).first().click();
  await expect(page.getByRole('main').getByText(OPERATOR.displayName).first()).toBeVisible();
});
