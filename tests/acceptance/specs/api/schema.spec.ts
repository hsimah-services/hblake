import fs from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { Api } from '../../lib/api.ts';
// Articles and Products are PageItems, so the schema has two content types.
const CONTENT = [
  { type: 'Page', field: 'page' },
  { type: 'PageItem', field: 'pageItem' },
] as const;
import { REPO_ROOT } from '../../lib/env.ts';

// The GraphQL surface: generated content operations, the application-owned viewer and
// operator profile, and nothing that exposes User or credentials (architecture.md,
// User.md, acceptance 5).

interface TypeRef {
  kind: string;
  name: string | null;
  ofType: TypeRef | null;
}
interface Field {
  name: string;
  type: TypeRef;
  args?: { name: string; type: TypeRef }[];
}
interface FullType {
  kind: string;
  name: string;
  fields: Field[] | null;
  inputFields: Field[] | null;
  enumValues: { name: string }[] | null;
}

const TYPE_REF = 'kind name ofType { kind name ofType { kind name ofType { kind name } } }';
const INTROSPECTION = `query Schema {
  __schema {
    queryType { name }
    mutationType { name }
    types {
      kind name
      fields(includeDeprecated: true) { name type { ${TYPE_REF} } args { name type { ${TYPE_REF} } } }
      inputFields { name type { ${TYPE_REF} } }
      enumValues(includeDeprecated: true) { name }
    }
  }
}`;

let types: Map<string, FullType>;
let queryType: FullType;
let mutationType: FullType;

test.beforeAll(async () => {
  const api = await Api.anonymous();
  const data = await api.ok(INTROSPECTION);
  types = new Map((data.__schema.types as FullType[]).map(type => [type.name, type]));
  queryType = types.get(data.__schema.queryType.name)!;
  mutationType = types.get(data.__schema.mutationType?.name)!;
  expect(mutationType, 'schema has a mutation root').toBeTruthy();
  await api.dispose();
});

const named = (ref: TypeRef): string => (ref.name ?? named(ref.ofType!));
const fieldNames = (type: FullType | undefined): string[] => (type?.fields ?? type?.inputFields ?? []).map(f => f.name);
const typeOf = (owner: FullType, name: string): FullType | undefined => {
  const f = (owner.fields ?? []).find(candidate => candidate.name === name);
  return f ? types.get(named(f.type)) : undefined;
};
const argInput = (name: string): FullType | undefined => {
  const mutation = (mutationType.fields ?? []).find(f => f.name === name);
  const input = mutation?.args?.find(arg => arg.name === 'input');
  return input ? types.get(named(input.type)) : undefined;
};

test('content root fields exist for every content type', () => {
  const roots = fieldNames(queryType);
  for (const { field } of CONTENT) {
    expect(roots).toEqual(expect.arrayContaining([field, `${field}s`, `${field}BySlug`]));
  }
  expect(roots, 'the items of one page').toContain('pageItemsOfPage');
  expect(roots).toEqual(expect.arrayContaining(['node', 'viewer', 'adminUser']));
});

test('there are no Post or Product types, fields or operations', () => {
  for (const name of ['Post', 'Product']) expect(types.has(name), `GraphQL type ${name}`).toBe(false);
  const everything = [...fieldNames(queryType), ...fieldNames(mutationType)];
  expect(everything.filter(name => /post|product/i.test(name))).toEqual([]);
});

test('items are listed by page, newest published first, with a page filter', () => {
  const ofPage = (queryType.fields ?? []).find(f => f.name === 'pageItemsOfPage');
  expect(ofPage?.args?.map(arg => arg.name), 'paged, filtered by page').toEqual(expect.arrayContaining(['after', 'first', 'where']));
  const where = types.get(named(ofPage!.args!.find(arg => arg.name === 'where')!.type));
  expect(fieldNames(where), 'filtered by the slug of the page').toEqual(['page']);
});

test('content mutations exist for every content type', () => {
  const mutations = fieldNames(mutationType);
  for (const { type } of CONTENT) {
    expect(mutations).toEqual(
      expect.arrayContaining([`create${type}`, `update${type}`, `publish${type}`, `unpublish${type}`, `delete${type}`]),
    );
  }
  expect(mutations).toContain('updateAdminUser');
});

test('no generic User type or account lifecycle operations are exposed', () => {
  expect(types.has('User'), 'no GraphQL type named User').toBe(false);
  const accountFields = [...fieldNames(queryType), ...fieldNames(mutationType)].filter(name => /user/i.test(name));
  expect(accountFields.sort()).toEqual(['adminUser', 'updateAdminUser']);
});

test('no type exposes credentials or session secrets', () => {
  const offending: string[] = [];
  for (const type of types.values()) {
    if (type.name.startsWith('__')) continue;
    for (const f of [...(type.fields ?? []), ...(type.inputFields ?? [])]) {
      if (/password|passwordhash|credential|secret|session|resettoken|apitoken/i.test(f.name)) offending.push(`${type.name}.${f.name}`);
    }
  }
  expect(offending).toEqual([]);
});

test('content types expose the specified fields; everything links only an author display name', () => {
  const common = ['id', 'title', 'slug', 'content', 'excerpt', 'status', 'publishedAt', 'createdAt', 'updatedAt', 'author'];
  const extra: Record<string, string[]> = {
    Page: ['showInNavigation', 'navigationOrder', 'featureOnHome', 'homeOrder', 'accent', 'defaultItemKind', 'items', 'itemCount', 'publishedItemCount'],
    PageItem: ['kind', 'enquiryUrl', 'page'],
  };
  for (const { type } of CONTENT) {
    const content = types.get(type);
    expect(content, `GraphQL type ${type}`).toBeTruthy();
    expect(fieldNames(content).sort()).toEqual([...common, ...extra[type]].sort());
    const author = typeOf(content!, 'author');
    expect(author?.kind, `${type}.author`).toBe('OBJECT');
    expect(fieldNames(author), `the public author projection of ${type}`).toEqual(['displayName']);
  }
  expect(fieldNames(typeOf(types.get('PageItem')!, 'page')).sort(), 'an item links its page').toEqual(
    fieldNames(types.get('Page')).sort(),
  );
});

test('create and update inputs never accept ids, authors or managed timestamps', () => {
  for (const { type } of CONTENT) {
    const create = fieldNames(argInput(`create${type}`));
    const update = fieldNames(argInput(`update${type}`));
    expect(create, `create${type} input`).toEqual(expect.arrayContaining(['title', 'slug', 'content', 'excerpt']));
    expect(update, `update${type} input`).toContain('id');
    for (const managed of ['createdAt', 'updatedAt', 'author']) {
      expect(create, `create${type} ${managed}`).not.toContain(managed);
      expect(update, `update${type} ${managed}`).not.toContain(managed);
    }
    expect(create).not.toContain('id');
  }
  const item = fieldNames(argInput('createPageItem'));
  expect(item, 'an item is attached to a page and labelled with a kind').toEqual(expect.arrayContaining(['page', 'kind', 'enquiryUrl']));
  expect(fieldNames(argInput('updatePageItem')), 'enquiryUrl can be changed').toContain('enquiryUrl');
  expect(fieldNames(argInput('createPage')), 'a page chooses its item kind').toContain('defaultItemKind');
});

test('publication status is the DRAFT/PUBLISHED enum', () => {
  const status = typeOf(types.get('Page')!, 'status');
  expect(status?.kind).toBe('ENUM');
  expect((status?.enumValues ?? []).map(value => value.name).sort()).toEqual(['DRAFT', 'PUBLISHED']);
});

test('viewer exposes only id, displayName and role', () => {
  const viewer = typeOf(queryType, 'viewer');
  expect(viewer, 'viewer type').toBeTruthy();
  expect(fieldNames(viewer).sort()).toEqual(['displayName', 'id', 'role']);
});

test('the operator profile DTO and its input are allowlisted', () => {
  const profile = typeOf(queryType, 'adminUser');
  expect(profile, 'adminUser type').toBeTruthy();
  expect(fieldNames(profile).sort()).toEqual(['displayName', 'id', 'username']);
  const input = fieldNames(argInput('updateAdminUser')).filter(name => name !== 'clientMutationId');
  expect(input.sort()).toEqual(['displayName', 'id']);
});

test('content types are Relay nodes', () => {
  expect(types.get('Node')?.kind).toBe('INTERFACE');
  const node = (queryType.fields ?? []).find(f => f.name === 'node');
  expect(node?.args?.map(arg => arg.name)).toEqual(['id']);
});

test('the client schema snapshot matches the running server', () => {
  // relay-compiler validates operations against client/schema.graphql only, so a server
  // change that is not re-exported would otherwise pass every gate.
  const sdl = fs.readFileSync(path.join(REPO_ROOT, 'client/schema.graphql'), 'utf8');
  const missing = (have: Set<string>, want: Set<string>): string[] => [...want].filter(item => !have.has(item)).sort();
  const client = sdlSignatures(sdl);
  const server = serverSignatures();
  expect({ onlyOnServer: missing(client, server), onlyInClient: missing(server, client) }).toEqual({ onlyOnServer: [], onlyInClient: [] });
});

const BUILT_IN_SCALARS = new Set(['String', 'Int', 'Float', 'Boolean', 'ID']);
const render = (ref: TypeRef): string =>
  ref.kind === 'NON_NULL' ? `${render(ref.ofType!)}!` : ref.kind === 'LIST' ? `[${render(ref.ofType!)}]` : ref.name!;

function serverSignatures(): Set<string> {
  const out = new Set<string>();
  for (const type of types.values()) {
    if (type.name.startsWith('__') || BUILT_IN_SCALARS.has(type.name)) continue;
    if (type.kind === 'SCALAR') out.add(`scalar ${type.name}`);
    for (const value of type.enumValues ?? []) out.add(`${type.name}.${value.name}`);
    for (const f of type.inputFields ?? []) out.add(`${type.name}.${f.name}: ${render(f.type)}`);
    for (const f of type.fields ?? []) {
      const args = (f.args ?? []).map(arg => `${arg.name}: ${render(arg.type)}`).join(', ');
      out.add(`${type.name}.${f.name}${args ? `(${args})` : ''}: ${render(f.type)}`);
    }
  }
  return out;
}

function sdlSignatures(sdl: string): Set<string> {
  const out = new Set<string>();
  const text = sdl.replace(/"""[\s\S]*?"""/g, '').replace(/"(?:[^"\\\n]|\\.)*"/g, '').replace(/#[^\n]*/g, '');
  for (const [, name] of text.matchAll(/^scalar\s+(\w+)/gm)) out.add(`scalar ${name}`);
  for (const [, keyword, name, body] of text.matchAll(/^(type|interface|input|enum)\s+(\w+)[^{]*\{([^}]*)\}/gm)) {
    if (keyword === 'enum') {
      for (const [value] of body.matchAll(/\w+/g)) out.add(`${name}.${value}`);
      continue;
    }
    for (const [, fieldName, rawArgs, result] of body.matchAll(/(\w+)\s*(?:\(([^)]*)\))?\s*:\s*([\w!\[\]]+)/g)) {
      const args = (rawArgs ?? '')
        .split(/[,\n]/)
        .map(arg => arg.trim().replace(/\s*=.*$/, ''))
        .filter(Boolean)
        .map(arg => arg.replace(/\s*:\s*/, ': '))
        .join(', ');
      out.add(`${name}.${fieldName}${args ? `(${args})` : ''}: ${result}`);
    }
  }
  return out;
}
