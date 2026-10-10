import { createElement } from 'react';
import { resource, type EntryPointProps, type RouteEntryPoint } from '@tsquid/routes/entrypoint';
import { Admin } from './Admin';
import { AdminQueryVariables } from './AdminQuery';
import QUERY_NODE, { type AdminQuery } from './__generated__/AdminQuery.graphql';
import type { EntryRoute } from '../../routes/EntryRoute';

export function AdminEntryPoint({ queries }: EntryPointProps<Queries, Empty, Empty, Empty>) { return createElement(Admin, { queryRef: queries.content }); }

export const ADMIN_ENTRY_POINT: RouteEntryPoint<EntryRoute, Queries, Empty, Empty, Empty> = {
  root: resource('Admin', AdminEntryPoint),
  getPreloadProps: route => ({ queries: { content: { parameters: QUERY_NODE, variables: AdminQueryVariables(route), options: { fetchPolicy: 'network-only' } } } }),
};

type Queries = { content: AdminQuery };
type Empty = Record<string, never>;
