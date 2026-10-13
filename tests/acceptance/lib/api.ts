import { expect, request, type APIRequestContext, type APIResponse } from '@playwright/test';

import { BASE_URL, OPERATOR } from './env.ts';

export interface GraphQLError {
  message: string;
  path?: (string | number)[];
  extensions?: Record<string, unknown>;
}

export interface GraphQLResult<T = any> {
  status: number;
  headers: Record<string, string>;
  /** Raw response text, for asserting that nothing private leaked anywhere in it. */
  body: string;
  data: T | null;
  errors: GraphQLError[];
}

export interface StorageState {
  cookies: Awaited<ReturnType<APIRequestContext['storageState']>>['cookies'];
  origins: [];
}

/**
 * One HTTP client with its own cookie jar: an anonymous visitor or a signed-in operator.
 *
 * Contract (tests/README.md): GET /auth/csrf returns { token }; every POST that changes
 * state (POST /auth/login, POST /auth/logout, GraphQL mutations) sends it as X-CSRF-Token.
 */
export class Api {
  private csrf: string | undefined;

  private constructor(readonly ctx: APIRequestContext) {}

  static async anonymous(state?: StorageState): Promise<Api> {
    return new Api(await request.newContext({ baseURL: BASE_URL, storageState: state }));
  }

  static async operator(): Promise<Api> {
    const api = await Api.anonymous();
    const response = await api.login(OPERATOR.username, OPERATOR.password);
    expect(response.status(), `operator login failed: ${await response.text()}`).toBe(200);
    return api;
  }

  async csrfToken(refresh = false): Promise<string> {
    if (!this.csrf || refresh) {
      const response = await this.ctx.get('/auth/csrf');
      expect(response.status(), 'GET /auth/csrf').toBe(200);
      const json = await response.json();
      expect(typeof json.token, 'GET /auth/csrf returns { token: string }').toBe('string');
      this.csrf = json.token as string;
    }
    return this.csrf!;
  }

  async login(username: string, password: string, options: { csrf?: boolean } = {}): Promise<APIResponse> {
    const headers: Record<string, string> = {};
    if (options.csrf !== false) headers['X-CSRF-Token'] = await this.csrfToken(true);
    const response = await this.ctx.post('/auth/login', { data: { username, password }, headers });
    // The token may rotate with the session; fetch a fresh one for the next write.
    this.csrf = undefined;
    return response;
  }

  /** POST /auth/password for the signed-in account; sends the CSRF token unless `csrf` is false. */
  async changePassword(currentPassword: string, newPassword: string, options: { csrf?: boolean } = {}): Promise<APIResponse> {
    const headers: Record<string, string> = {};
    if (options.csrf !== false) headers['X-CSRF-Token'] = await this.csrfToken(true);
    return this.ctx.post('/auth/password', { data: { currentPassword, newPassword }, headers });
  }

  async logout(options: { csrf?: boolean } = {}): Promise<APIResponse> {
    const headers: Record<string, string> = {};
    if (options.csrf !== false) headers['X-CSRF-Token'] = await this.csrfToken(true);
    const response = await this.ctx.post('/auth/logout', { headers });
    this.csrf = undefined;
    return response;
  }

  /**
   * POST /graphql. Mutations carry the CSRF token unless `csrf` is false (omit it) or a
   * string (send that value instead).
   */
  async graphql<T = any>(
    query: string,
    variables: Record<string, unknown> = {},
    options: { csrf?: boolean | string } = {},
  ): Promise<GraphQLResult<T>> {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    const isMutation = /^\s*mutation\b/.test(query);
    if (typeof options.csrf === 'string') headers['X-CSRF-Token'] = options.csrf;
    else if (options.csrf !== false && isMutation) headers['X-CSRF-Token'] = await this.csrfToken();

    const response = await this.ctx.post('/graphql', { data: { query, variables }, headers });
    const body = await response.text();
    let json: { data?: T | null; errors?: GraphQLError[] } | null = null;
    try {
      json = JSON.parse(body);
    } catch {
      json = null;
    }
    return {
      status: response.status(),
      headers: response.headers(),
      body,
      data: json?.data ?? null,
      errors: json?.errors ?? [],
    };
  }

  /** A GraphQL operation that must succeed; returns its data. */
  async ok<T = any>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    const result = await this.graphql<T>(query, variables);
    expect(result.status, `HTTP status for ${firstLine(query)}: ${result.body}`).toBe(200);
    expect(result.errors, `GraphQL errors for ${firstLine(query)}`).toEqual([]);
    expect(result.data).not.toBeNull();
    return result.data as T;
  }

  async viewer(): Promise<{ id: string; displayName: string; role: string } | null> {
    const result = await this.graphql('query Viewer { viewer { id displayName role } }');
    expect(result.status).toBe(200);
    return result.data?.viewer ?? null;
  }

  async storageState(): Promise<StorageState> {
    const state = await this.ctx.storageState();
    return { cookies: state.cookies, origins: [] };
  }

  async dispose(): Promise<void> {
    await this.ctx.dispose();
  }
}

/** The server refused the operation: an HTTP error status, or GraphQL errors. */
export function expectRejected(result: GraphQLResult, message?: string): void {
  const rejected = result.status >= 400 || result.errors.length > 0;
  expect(rejected, `${message ?? 'expected the server to reject the operation'}; got ${result.status} ${result.body.slice(0, 500)}`).toBe(true);
}

/** Every Set-Cookie header on a response, parsed into name, value and lowercased attributes. */
export function setCookies(response: APIResponse): { name: string; value: string; attributes: Map<string, string> }[] {
  return response
    .headersArray()
    .filter(header => header.name.toLowerCase() === 'set-cookie')
    .map(header => {
      const [pair, ...rest] = header.value.split(';');
      const index = pair.indexOf('=');
      const attributes = new Map<string, string>();
      for (const part of rest) {
        const [key, ...value] = part.trim().split('=');
        attributes.set(key.toLowerCase(), value.join('='));
      }
      return { name: pair.slice(0, index).trim(), value: pair.slice(index + 1).trim(), attributes };
    });
}

function firstLine(query: string): string {
  return query.trim().split('\n')[0];
}
