import { expect } from '@playwright/test';

import { Api, type GraphQLResult } from './api.ts';
import { RUN_ID } from './env.ts';

// GraphQL names follow from the spec and elephentity-codegen-graphql-php: the
// `graphql.singular`/`plural` integration settings give `page`/`pages`, mutations are
// `create{Type}`, `update{Type}`, `{action}{Type}` and `delete{Type}` taking
// `input: {Name}Input!`, and their payload carries the row under the lcfirst type name.
export type Kind = 'Page' | 'Post' | 'Product';
export const KINDS: readonly Kind[] = ['Page', 'Post', 'Product'];

export interface Content {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  enquiryUrl?: string | null;
}

export type ContentInput = Partial<Omit<Content, 'id'>> & Record<string, unknown>;

export const field = (kind: Kind): string => kind.charAt(0).toLowerCase() + kind.slice(1);
export const collection = (kind: Kind): string => `${field(kind)}s`;
export const publicPath = (kind: Kind, slug: string): string =>
  ({ Page: `/pages/${slug}`, Post: `/posts/${slug}`, Product: `/products/${slug}` })[kind];
export const adminPath = (kind: Kind): string => `/admin/${collection(kind)}`;

export function selection(kind: Kind): string {
  return `id title slug content excerpt status publishedAt createdAt updatedAt${kind === 'Product' ? ' enquiryUrl' : ''}`;
}

let counter = 0;

/** A slug valid under website.md's rule and unique to this run. */
export function uniqueSlug(label = 't'): string {
  counter += 1;
  return `${label}-${RUN_ID}-${counter}`.toLowerCase();
}

export function defaults(kind: Kind, overrides: ContentInput = {}): ContentInput {
  const slug = (overrides.slug as string | undefined) ?? uniqueSlug(field(kind));
  return {
    title: `${kind} ${slug}`,
    slug,
    content: `Body of ${slug}.\n\n## Section\n\nSome **bold** text.`,
    excerpt: `Excerpt of ${slug}.`,
    ...overrides,
  };
}

export function create(api: Api, kind: Kind, input: ContentInput): Promise<GraphQLResult> {
  return api.graphql(
    `mutation Create($input: Create${kind}Input!) { create${kind}(input: $input) { ${field(kind)} { ${selection(kind)} } } }`,
    { input },
  );
}

export async function createOk(api: Api, kind: Kind, overrides: ContentInput = {}): Promise<Content> {
  const input = defaults(kind, overrides);
  const result = await create(api, kind, input);
  expect(result.errors, `create${kind} errors: ${result.body.slice(0, 500)}`).toEqual([]);
  const row = result.data?.[`create${kind}`]?.[field(kind)] as Content | undefined;
  expect(row, `create${kind} returns the created ${kind}`).toBeTruthy();
  return row!;
}

export function update(api: Api, kind: Kind, id: string, input: ContentInput): Promise<GraphQLResult> {
  return api.graphql(
    `mutation Update($input: Update${kind}Input!) { update${kind}(input: $input) { ${field(kind)} { ${selection(kind)} } } }`,
    { input: { id, ...input } },
  );
}

export async function updateOk(api: Api, kind: Kind, id: string, input: ContentInput): Promise<Content> {
  const result = await update(api, kind, id, input);
  expect(result.errors, `update${kind} errors: ${result.body.slice(0, 500)}`).toEqual([]);
  return result.data[`update${kind}`][field(kind)] as Content;
}

export function action(api: Api, kind: Kind, name: 'publish' | 'unpublish', id: string): Promise<GraphQLResult> {
  const mutation = `${name}${kind}`;
  const inputType = `${name.charAt(0).toUpperCase()}${name.slice(1)}${kind}Input`;
  return api.graphql(
    `mutation Action($input: ${inputType}!) { ${mutation}(input: $input) { ${field(kind)} { ${selection(kind)} } } }`,
    { input: { id } },
  );
}

export async function publishOk(api: Api, kind: Kind, id: string): Promise<Content> {
  const result = await action(api, kind, 'publish', id);
  expect(result.errors, `publish${kind} errors: ${result.body.slice(0, 500)}`).toEqual([]);
  return result.data[`publish${kind}`][field(kind)] as Content;
}

export async function unpublishOk(api: Api, kind: Kind, id: string): Promise<Content> {
  const result = await action(api, kind, 'unpublish', id);
  expect(result.errors, `unpublish${kind} errors: ${result.body.slice(0, 500)}`).toEqual([]);
  return result.data[`unpublish${kind}`][field(kind)] as Content;
}

export function remove(api: Api, kind: Kind, id: string): Promise<GraphQLResult> {
  return api.graphql(`mutation Delete($input: Delete${kind}Input!) { delete${kind}(input: $input) { deletedId } }`, {
    input: { id },
  });
}

export async function createPublished(api: Api, kind: Kind, overrides: ContentInput = {}): Promise<Content> {
  const row = await createOk(api, kind, overrides);
  return publishOk(api, kind, row.id);
}

/** Result of `{kind}BySlug`; data may be null when the viewer cannot see the row. */
export function bySlugRaw(api: Api, kind: Kind, slug: string): Promise<GraphQLResult> {
  return api.graphql(`query BySlug($slug: String!) { ${field(kind)}BySlug(slug: $slug) { ${selection(kind)} } }`, { slug });
}

export async function bySlug(api: Api, kind: Kind, slug: string): Promise<Content | null> {
  const result = await bySlugRaw(api, kind, slug);
  return (result.data?.[`${field(kind)}BySlug`] as Content | null | undefined) ?? null;
}

export function byIdRaw(api: Api, kind: Kind, id: string): Promise<GraphQLResult> {
  return api.graphql(`query ById($id: ID!) { ${field(kind)}(id: $id) { ${selection(kind)} } }`, { id });
}

export async function byId(api: Api, kind: Kind, id: string): Promise<Content | null> {
  const result = await byIdRaw(api, kind, id);
  return (result.data?.[field(kind)] as Content | null | undefined) ?? null;
}

export interface ConnectionPage {
  totalCount: number;
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
  nodes: Content[];
}

export function pageOfRaw(api: Api, kind: Kind, args: { first?: number; after?: string | null } = {}): Promise<GraphQLResult> {
  const params: string[] = [];
  const variables: Record<string, unknown> = {};
  if (args.first !== undefined) {
    params.push('first: $first');
    variables.first = args.first;
  }
  if (args.after) {
    params.push('after: $after');
    variables.after = args.after;
  }
  const declared = [args.first !== undefined ? '$first: Int' : '', args.after ? '$after: String' : ''].filter(Boolean).join(', ');
  return api.graphql(
    `query Page${declared ? `(${declared})` : ''} { ${collection(kind)}${params.length ? `(${params.join(', ')})` : ''} { totalCount pageInfo { hasNextPage endCursor } nodes { ${selection(kind)} } } }`,
    variables,
  );
}

export async function pageOf(api: Api, kind: Kind, args: { first?: number; after?: string | null } = {}): Promise<ConnectionPage> {
  const result = await pageOfRaw(api, kind, args);
  expect(result.errors, `${collection(kind)} errors: ${result.body.slice(0, 500)}`).toEqual([]);
  return result.data[collection(kind)] as ConnectionPage;
}

/**
 * Every row the viewer can see, following endCursor while hasNextPage — including
 * through short or empty pages, which v1 accepts for policy-filtered lists.
 */
export async function walk(api: Api, kind: Kind, first = 100): Promise<{ nodes: Content[]; totalCount: number; bodies: string[] }> {
  const nodes: Content[] = [];
  const bodies: string[] = [];
  let after: string | null = null;
  let totalCount = 0;
  for (let i = 0; i < 1000; i += 1) {
    const result = await pageOfRaw(api, kind, { first, after });
    expect(result.errors, `${collection(kind)} errors: ${result.body.slice(0, 500)}`).toEqual([]);
    bodies.push(result.body);
    const page = result.data[collection(kind)] as ConnectionPage;
    totalCount = page.totalCount;
    nodes.push(...page.nodes);
    if (!page.pageInfo.hasNextPage) return { nodes, totalCount, bodies };
    expect(page.pageInfo.endCursor, 'hasNextPage implies an endCursor').toBeTruthy();
    after = page.pageInfo.endCursor;
  }
  throw new Error(`${collection(kind)} pagination did not terminate`);
}

/** Find or create the Page with this slug in the requested state; returns it. */
export async function ensurePage(
  api: Api,
  slug: string,
  state: 'PUBLISHED' | 'DRAFT',
  overrides: ContentInput = {},
): Promise<Content> {
  let page = await bySlug(api, 'Page', slug);
  if (!page) page = await createOk(api, 'Page', defaults('Page', { slug, ...overrides }));
  if (state === 'PUBLISHED' && page.status !== 'PUBLISHED') page = await publishOk(api, 'Page', page.id);
  if (state === 'DRAFT' && page.status !== 'DRAFT') page = await unpublishOk(api, 'Page', page.id);
  return page;
}

export const UTC_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|\+00:00)$/;

export function expectRecent(timestamp: string | null, label: string, toleranceMs = 120_000): void {
  expect(timestamp, `${label} is set`).not.toBeNull();
  expect(timestamp!, `${label} is an ISO 8601 UTC timestamp`).toMatch(UTC_TIMESTAMP);
  const skew = Math.abs(Date.parse(timestamp!) - Date.now());
  expect(skew, `${label} (${timestamp}) is within ${toleranceMs / 1000}s of now`).toBeLessThan(toleranceMs);
}

export const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
