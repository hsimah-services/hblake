import { Environment, Network, RecordSource, Store, type RequestParameters } from 'relay-runtime';
import { readInitialData, withInitialData } from '@tsquid/routes/initialData';
import { createFetchGraphQL } from '@tsquid/routes/network';

export const ENVIRONMENT = new Environment({
  network: Network.create(withInitialData(createFetchGraphQL({ url: '/graphql', headers: requestHeaders }), readInitialData(), { warn: import.meta.env.DEV })),
  store: new Store(new RecordSource()),
});

async function requestHeaders(request: RequestParameters): Promise<HeadersInit> {
  if (request.operationKind !== 'mutation') return {};
  const response = await fetch('/auth/csrf', { credentials: 'same-origin', cache: 'no-store' });
  if (!response.ok) throw new Error('Your session could not be verified. Your edits have been kept.');
  const csrf = await response.json() as { token: string };
  return { 'X-CSRF-Token': csrf.token };
}
