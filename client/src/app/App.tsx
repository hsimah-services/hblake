import { Suspense } from 'react';
import { createBrowserRouter, redirect } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { RelayEnvironmentProvider } from 'react-relay';
import { createLink } from '@tsquid/routes/Link';
import { LinkProvider } from '@astryxdesign/core/Link';
import { ColorMode } from '../ColorMode';
import { Motion } from '../Motion';
import { ENVIRONMENT } from '../relay/environment';
import { LoginURI } from '../routes/__generated__/routes';
import { ROUTES } from '../routes/routes';

const APP_LINK = createLink(Object.values(ROUTES));
const ROUTER = createBrowserRouter(Object.entries(ROUTES).map(([name, route]) => ({ path: route.path, Component: route.Root, loader: name.startsWith('Admin') ? requireViewer : undefined })));

export function App() {
  return <RelayEnvironmentProvider environment={ENVIRONMENT}><ColorMode><Motion><LinkProvider component={APP_LINK}><Suspense fallback={<p>Loading…</p>}><RouterProvider router={ROUTER} /></Suspense></LinkProvider></Motion></ColorMode></RelayEnvironmentProvider>;
}

async function requireViewer() {
  const response = await fetch('/graphql', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: 'query { viewer { id } }' }) });
  const data = await response.json() as { data?: { viewer?: { id: string } | null } };
  return data.data?.viewer ? null : redirect(LoginURI.getURI({}));
}
