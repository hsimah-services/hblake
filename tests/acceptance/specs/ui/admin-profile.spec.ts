import { expect, test } from '@playwright/test';

import { Api } from '../../lib/api.ts';
import { BASE_URL, OPERATOR } from '../../lib/env.ts';
import { announcedError, confirmation, forbiddenControls, signIn } from '../../lib/ui.ts';

// The operator settings screens (ui/admin.yml User): the detail shows the username and
// display name and changes the password; the edit form changes only the display name.
// Each test restores the profile and password through the API.

const RESTORE = `mutation Restore($input: UpdateAdminUserInput!) { updateAdminUser(input: $input) { adminUser { id } } }`;
const NEW_PASSWORD = `${OPERATOR.password}-from-settings`;

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
  await api.graphql(RESTORE, { input: { id, displayName: OPERATOR.displayName } });
});

test.afterAll(async () => {
  await api.dispose();
});

const detail = (): string => `/admin/users/${encodeURIComponent(id)}`;

test('settings show the username and display name, with no role, status or email', async ({ page }) => {
  await page.goto(detail());
  const main = page.getByRole('main');
  await expect(main.getByText(OPERATOR.displayName).first()).toBeVisible();
  await expect(main.getByText(OPERATOR.username).first()).toBeVisible();
  await expect(main.getByText(/email|role|active/i)).toHaveCount(0);
  // The only inputs here are the password-change form's; the profile is edited elsewhere.
  await expect(page.getByRole('textbox', { name: /username|display name|email/i })).toHaveCount(0);
  await expect(page.getByLabel('Current password')).toHaveAttribute('type', 'password');
});

test('the profile form edits only the display name', async ({ page }) => {
  await page.goto(`${detail()}/edit`);
  await expect(page.getByLabel('Display name')).toHaveValue(OPERATOR.displayName);
  await expect(page.getByRole('textbox')).toHaveCount(1);
  await expect(page.getByLabel(/username|email/i)).toHaveCount(0);
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
  await page.getByRole('button', { name: /^save/i }).click();
  await expect(announcedError(page).first()).toBeVisible();
  await expect(page.getByLabel('Display name')).toHaveAttribute('aria-invalid', 'true');
  expect((await api.viewer())?.displayName).toBe(OPERATOR.displayName);
});

test('the admin home links to settings', async ({ page }) => {
  await page.goto('/admin');
  await page.getByRole('main').getByRole('link', { name: /settings/i }).click();
  await expect(page).toHaveURL(`${BASE_URL}${detail()}`);
  await expect(page.getByRole('main').getByText(OPERATOR.username).first()).toBeVisible();
});

test('mismatched new passwords are refused before anything is sent', async ({ page }) => {
  await page.goto(detail());
  await page.getByLabel('Current password').fill(OPERATOR.password);
  await page.getByLabel('New password', { exact: true }).fill(NEW_PASSWORD);
  await page.getByLabel('Confirm new password').fill(`${NEW_PASSWORD}-typo`);
  await page.getByRole('button', { name: /change password/i }).click();
  await expect(announcedError(page).first()).toBeVisible();
  await expect(page.getByLabel('Confirm new password')).toHaveAttribute('aria-invalid', 'true');
  expect(await api.viewer(), 'nothing was changed, so other sessions still work').not.toBeNull();
});

test('a wrong current password is refused with an announced error', async ({ page }) => {
  await page.goto(detail());
  await page.getByLabel('Current password').fill(`${OPERATOR.password}-wrong`);
  await page.getByLabel('New password', { exact: true }).fill(NEW_PASSWORD);
  await page.getByLabel('Confirm new password').fill(NEW_PASSWORD);
  await page.getByRole('button', { name: /change password/i }).click();
  await expect(announcedError(page).first()).toContainText(/current password/i);
  expect(await api.viewer()).not.toBeNull();
});

test('the password can be changed from settings', async ({ page }) => {
  await page.goto(detail());
  await page.getByLabel('Current password').fill(OPERATOR.password);
  await page.getByLabel('New password', { exact: true }).fill(NEW_PASSWORD);
  await page.getByLabel('Confirm new password').fill(NEW_PASSWORD);
  await page.getByRole('button', { name: /change password/i }).click();
  try {
    await expect(confirmation(page)).toBeVisible();
    await expect(page.getByLabel('Current password')).toHaveValue('');
    expect(await api.viewer(), 'other sessions are signed out').toBeNull();
    const changed = await Api.anonymous();
    expect((await changed.login(OPERATOR.username, NEW_PASSWORD)).status()).toBe(200);
    expect((await changed.changePassword(NEW_PASSWORD, OPERATOR.password)).status(), 'restoring ADMIN_PASSWORD').toBe(200);
    await changed.dispose();
  } finally {
    await api.dispose();
    api = await Api.operator();
  }
});
