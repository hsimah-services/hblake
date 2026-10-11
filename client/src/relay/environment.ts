import { Environment, Network, RecordSource, Store, type FetchFunction } from 'relay-runtime';
import { readInitialData, withInitialData } from '@tsquid/routes/initialData';

// The PHP server inlines the initial route's query response as #tsquid-data
// (routes.json `query`, generated/tsquid); later requests go to /graphql.
export const ENVIRONMENT = new Environment({
  network: Network.create(withInitialData(fetchGraphQL, readInitialData(), { warn: import.meta.env.DEV })),
  store: new Store(new RecordSource()),
});

async function fetchGraphQL(...[request, variables]: Parameters<FetchFunction>) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (request.operationKind === 'mutation') {
    const response = await fetch('/auth/csrf', { credentials: 'same-origin', cache: 'no-store' });
    const csrf = await response.json() as { token: string };
    headers['X-CSRF-Token'] = csrf.token;
  }
  const response = await fetch('/graphql', {
    method: 'POST', headers, credentials: 'same-origin', cache: 'no-store',
    body: JSON.stringify({ query: request.text, variables }),
  });
  if (!response.ok) throw new Error('Your session or request could not be verified. Your edits have been kept.');
  const result = await response.json();
  if (result.errors?.length) throw new Error(result.errors.map((error: { message: string }) => error.message).join(' '));
  return result;
}
