import { expect, type Locator, type Page } from '@playwright/test';

import { OPERATOR } from './env.ts';

/** Signs the browser context in through the HTTP contract, so UI tests start authenticated. */
export async function signIn(page: Page): Promise<void> {
  const csrf = await page.request.get('/auth/csrf');
  expect(csrf.status()).toBe(200);
  const { token } = await csrf.json();
  const response = await page.request.post('/auth/login', {
    data: { email: OPERATOR.email, password: OPERATOR.password },
    headers: { 'X-CSRF-Token': token },
  });
  expect(response.status(), `operator login failed: ${await response.text()}`).toBe(200);
}

/** The rendered "not found" state for unknown or unpublished public content. */
export function notFound(page: Page): Locator {
  return page.getByRole('heading', { name: /not found/i });
}

/** Presses Tab until `target` has focus, failing after `max` presses. */
export async function tabTo(page: Page, target: Locator, max = 12): Promise<void> {
  for (let i = 0; i < max; i += 1) {
    if (await target.evaluate(element => element === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  await expect(target, `reachable with Tab within ${max} presses`).toBeFocused();
}

/** Form controls whose label suggests a field the UI must never accept as input. */
export function forbiddenControls(page: Page, names: RegExp = FORBIDDEN_INPUTS): Locator {
  const roles = ['textbox', 'combobox', 'checkbox', 'switch', 'radio', 'spinbutton', 'listbox', 'radiogroup'] as const;
  return roles
    .map(role => page.getByRole(role, { name: names }))
    .reduce((all, next) => all.or(next));
}

const FORBIDDEN_INPUTS = /^\s*(id|status|publication status|published|published at|created|created at|updated|updated at|role|active)\s*$/i;

/** A save/create confirmation announced to assistive technology. */
export function confirmation(page: Page): Locator {
  return page.getByRole('status').or(page.getByRole('alert')).filter({ hasText: /saved|created|updated/i });
}

/** An announced error, in an alert region or error summary. */
export function announcedError(page: Page): Locator {
  return page.getByRole('alert');
}

/** Whether injected markup ran; markdown fixtures try to set window.__xss. */
export async function xssFired(page: Page): Promise<boolean> {
  return page.evaluate(() => (window as unknown as { __xss?: unknown }).__xss !== undefined);
}
