import { Environment, Network, RecordSource, Store, type RequestParameters } from 'relay-runtime';
import { readInitialData, withInitialData } from '@tsquid/routes/initialData';
import { createFetchGraphQL } from '@tsquid/routes/network';

const REQUEST_REFUSED = 'Your session or request could not be verified. Your edits have been kept.';

export const ENVIRONMENT = new Environment({
  network: Network.create(withInitialData(createFetchGraphQL({ url: '/graphql', headers: requestHeaders, fetch: fetchGraphQL }), readInitialData(), { warn: import.meta.env.DEV })),
  store: new Store(new RecordSource()),
});

async function requestHeaders(request: RequestParameters): Promise<HeadersInit> {
  if (request.operationKind !== 'mutation') return {};
  const response = await fetch('/auth/csrf', { credentials: 'same-origin', cache: 'no-store' });
  if (!response.ok) throw new Error(REQUEST_REFUSED);
  const csrf = await response.json() as { token: string };
  return { 'X-CSRF-Token': csrf.token };
}

async function fetchGraphQL(...args: Parameters<typeof fetch>): Promise<Response> {
  const response = await fetch(...args);
  if (!response.ok) throw new Error(REQUEST_REFUSED);
  const payload = await response.clone().json() as { errors?: { message: string }[] };
  if (payload.errors?.length) throw new Error(payload.errors.map(error => error.message).join(' '));
  return response;
}
