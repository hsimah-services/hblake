import { expect, test } from '@playwright/test';

import { Api, expectRejected } from '../../lib/api.ts';
import { UTC_TIMESTAMP } from '../../lib/content.ts';
import { OPERATOR } from '../../lib/env.ts';

// The single operator account (User.md, acceptance 4–6): an application-owned profile
// DTO, editable only in email and displayName. Every test restores the original values,
// because later tests sign in with ADMIN_EMAIL.

const PROFILE = 'id email displayName role active createdAt updatedAt';
const READ = `query Profile($id: ID!) { adminUser(id: $id) { ${PROFILE} } }`;
const UPDATE = `mutation UpdateProfile($input: UpdateAdminUserInput!) { updateAdminUser(input: $input) { adminUser { ${PROFILE} } } }`;

let api: Api;
let id: string;

test.beforeAll(async () => {
  api = await Api.operator();
  id = (await api.viewer())!.id;
});

test.afterEach(async () => {
  await api.graphql(UPDATE, { input: { id, email: OPERATOR.email, displayName: OPERATOR.displayName } });
});

test.afterAll(async () => {
  await api.dispose();
});

test('the operator reads their own profile', async () => {
  const { adminUser } = await api.ok(READ, { id });
  expect(adminUser).toMatchObject({
    id,
    email: OPERATOR.email.trim().toLowerCase(),
    displayName: OPERATOR.displayName,
    role: 'ADMIN',
    active: true,
  });
  expect(adminUser.createdAt).toMatch(UTC_TIMESTAMP);
  expect(adminUser.updatedAt).toMatch(UTC_TIMESTAMP);
});

test('viewer returns the allowlisted identity of the signed-in operator', async () => {
  expect(await api.viewer()).toEqual({ id, displayName: OPERATOR.displayName, role: 'ADMIN' });
});

test('the display name can be changed', async () => {
  const { updateAdminUser } = await api.ok(UPDATE, { input: { id, displayName: 'Renamed Operator' } });
  expect(updateAdminUser.adminUser).toMatchObject({ displayName: 'Renamed Operator', email: OPERATOR.email.toLowerCase() });
  expect((await api.viewer())?.displayName).toBe('Renamed Operator');
});

test('a blank display name is rejected', async () => {
  for (const displayName of ['', '   ']) {
    expectRejected(await api.graphql(UPDATE, { input: { id, displayName } }));
  }
  expect((await api.ok(READ, { id })).adminUser.displayName).toBe(OPERATOR.displayName);
});

test('email is trimmed and lowercased before it is stored', async () => {
  const [local, domain] = OPERATOR.email.split('@');
  const messy = `  ${local.toUpperCase()}+Profile@${domain.toUpperCase()}  `;
  const { updateAdminUser } = await api.ok(UPDATE, { input: { id, email: messy } });
  expect(updateAdminUser.adminUser.email).toBe(`${local.toLowerCase()}+profile@${domain.toLowerCase()}`);
});

test('an invalid email is rejected', async () => {
  for (const email of ['', 'not-an-email', '@example.com', 'operator@', `${'a'.repeat(250)}@example.com`]) {
    expectRejected(await api.graphql(UPDATE, { input: { id, email } }), `email ${email.slice(0, 40)}`);
  }
  expect((await api.ok(READ, { id })).adminUser.email).toBe(OPERATOR.email.toLowerCase());
});

test('role and active cannot be changed through the profile API', async () => {
  expectRejected(await api.graphql(UPDATE, { input: { id, role: 'EDITOR' } }));
  expectRejected(await api.graphql(UPDATE, { input: { id, active: false } }));
  expect((await api.ok(READ, { id })).adminUser).toMatchObject({ role: 'ADMIN', active: true });
});

test('the profile API refuses anonymous writes', async () => {
  const anonymous = await Api.anonymous();
  expectRejected(await anonymous.graphql(UPDATE, { input: { id, displayName: 'Anonymous edit' } }));
  await anonymous.dispose();
  expect((await api.ok(READ, { id })).adminUser.displayName).toBe(OPERATOR.displayName);
});
