import { expect, test } from '@playwright/test';

import { Api, expectRejected } from '../../lib/api.ts';
import { OPERATOR } from '../../lib/env.ts';

// The single operator account (User.md, acceptance 4–6): an application-owned profile
// DTO of username and display name, editable only in displayName. The username is the
// login and is not editable. Every test restores the original display name.

const PROFILE = 'id username displayName';
const READ = `query Profile($id: ID!) { adminUser(id: $id) { ${PROFILE} } }`;
const UPDATE = `mutation UpdateProfile($input: UpdateAdminUserInput!) { updateAdminUser(input: $input) { adminUser { ${PROFILE} } } }`;

let api: Api;
let id: string;

test.beforeAll(async () => {
  api = await Api.operator();
  id = (await api.viewer())!.id;
});

test.afterEach(async () => {
  await api.graphql(UPDATE, { input: { id, displayName: OPERATOR.displayName } });
});

test.afterAll(async () => {
  await api.dispose();
});

test('the operator reads their own profile', async () => {
  const { adminUser } = await api.ok(READ, { id });
  expect(adminUser).toEqual({ id, username: OPERATOR.username, displayName: OPERATOR.displayName });
});

test('viewer returns the allowlisted identity of the signed-in operator', async () => {
  expect(await api.viewer()).toEqual({ id, displayName: OPERATOR.displayName, role: 'ADMIN' });
});

test('the display name can be changed', async () => {
  const { updateAdminUser } = await api.ok(UPDATE, { input: { id, displayName: 'Renamed Operator' } });
  expect(updateAdminUser.adminUser).toEqual({ id, username: OPERATOR.username, displayName: 'Renamed Operator' });
  expect((await api.viewer())?.displayName).toBe('Renamed Operator');
});

test('a blank display name is rejected', async () => {
  for (const displayName of ['', '   ']) {
    expectRejected(await api.graphql(UPDATE, { input: { id, displayName } }));
  }
  expect((await api.ok(READ, { id })).adminUser.displayName).toBe(OPERATOR.displayName);
});

test('username, email, role and active cannot be changed through the profile API', async () => {
  for (const input of [{ username: 'renamed' }, { email: 'operator@example.test' }, { role: 'EDITOR' }, { active: false }]) {
    expectRejected(await api.graphql(UPDATE, { input: { id, ...input } }), JSON.stringify(input));
  }
  expect((await api.ok(READ, { id })).adminUser.username).toBe(OPERATOR.username);
  expect(await api.viewer()).toMatchObject({ role: 'ADMIN' });
});

test('the profile API refuses anonymous writes', async () => {
  const anonymous = await Api.anonymous();
  expectRejected(await anonymous.graphql(UPDATE, { input: { id, displayName: 'Anonymous edit' } }));
  await anonymous.dispose();
  expect((await api.ok(READ, { id })).adminUser.displayName).toBe(OPERATOR.displayName);
});
