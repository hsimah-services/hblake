import { Suspense } from 'react';
import { createBrowserRouter, redirect } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { RelayEnvironmentProvider } from 'react-relay';
import { Theme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';
import { ENVIRONMENT } from '../relay/environment';
import { LoginURI } from '../routes/__generated__/routes';
import { ROUTES } from '../routes/routes';

const ROUTER = createBrowserRouter(Object.entries(ROUTES).map(([name, route]) => ({ path: route.path, Component: route.Root, loader: name.startsWith('Admin') ? requireViewer : undefined })));

export function App() {
  return <RelayEnvironmentProvider environment={ENVIRONMENT}><Theme theme={neutralTheme}><Suspense fallback={<p>Loading…</p>}><RouterProvider router={ROUTER} /></Suspense></Theme></RelayEnvironmentProvider>;
}

async function requireViewer() {
  const response = await fetch('/graphql', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: 'query { viewer { id } }' }) });
  const data = await response.json() as { data?: { viewer?: { id: string } | null } };
  return data.data?.viewer ? null : redirect(LoginURI.getURI({}));
}
