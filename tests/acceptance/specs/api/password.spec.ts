import { expect, test } from '@playwright/test';

import { Api } from '../../lib/api.ts';
import { OPERATOR } from '../../lib/env.ts';

// Password change (User.md): POST /auth/password with {currentPassword, newPassword}
// and X-CSRF-Token, for the signed-in account only. Credentials never pass through
// GraphQL. Every test leaves ADMIN_PASSWORD working, because later tests sign in with it.
// This file makes three failed attempts; a successful login resets the rate limit.

const NEW_PASSWORD = `${OPERATOR.password}-changed`;

async function signsIn(password: string): Promise<number> {
  const api = await Api.anonymous();
  const status = (await api.login(OPERATOR.username, password)).status();
  await api.dispose();
  return status;
}

test('a password change needs a signed-in session and the CSRF token', async () => {
  const anonymous = await Api.anonymous();
  expect((await anonymous.changePassword(OPERATOR.password, NEW_PASSWORD)).status(), 'anonymous').toBe(401);
  await anonymous.dispose();

  const operator = await Api.operator();
  expect((await operator.changePassword(OPERATOR.password, NEW_PASSWORD, { csrf: false })).status(), 'without CSRF').toBe(403);
  await operator.dispose();
  expect(await signsIn(OPERATOR.password)).toBe(200);
});

test('a wrong current password or a short new password changes nothing', async () => {
  const operator = await Api.operator();
  const wrong = await operator.changePassword(`${OPERATOR.password}-wrong`, NEW_PASSWORD);
  expect(wrong.status()).toBe(401);
  const short = await operator.changePassword(OPERATOR.password, 'too-short');
  expect(short.status()).toBe(400);
  expect((await short.json()).error).toMatch(/12 characters/);
  expect(await operator.viewer(), 'the session survives refused changes').not.toBeNull();
  await operator.dispose();
  expect(await signsIn(OPERATOR.password)).toBe(200);
});

test('a new password replaces the old one and signs out other sessions', async () => {
  const changer = await Api.operator();
  const other = await Api.operator();
  try {
    const response = await changer.changePassword(OPERATOR.password, NEW_PASSWORD);
    expect(response.status(), await response.text()).toBe(200);
    expect(response.headers()['cache-control'] ?? '').toMatch(/no-store/);
    expect(await changer.viewer(), 'the session that changed it stays signed in').not.toBeNull();
    expect(await other.viewer(), 'other sessions are signed out').toBeNull();
    expect(await signsIn(OPERATOR.password), 'the old password').toBe(401);
    expect(await signsIn(NEW_PASSWORD), 'the new password').toBe(200);
  } finally {
    const restore = await changer.changePassword(NEW_PASSWORD, OPERATOR.password);
    expect(restore.status(), 'restoring ADMIN_PASSWORD').toBe(200);
    await changer.dispose();
    await other.dispose();
  }
  expect(await signsIn(OPERATOR.password)).toBe(200);
});
