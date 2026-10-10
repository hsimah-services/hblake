import { createElement } from 'react';
import { resource, type EntryPointProps, type RouteEntryPoint } from '@tsquid/routes/entrypoint';
import { AdminPage } from './AdminPage';
import { AdminPageQueryVariables } from './AdminPageQuery';
import QUERY_NODE, { type AdminPageQuery } from './__generated__/AdminPageQuery.graphql';
import type { EntryRoute } from '../../routes/EntryRoute';

export function AdminPageEntryPoint({ queries }: EntryPointProps<Queries, Empty, Empty, Empty>) { return createElement(AdminPage, { queryRef: queries.content }); }

export const ADMIN_PAGE_ENTRY_POINT: RouteEntryPoint<EntryRoute, Queries, Empty, Empty, Empty> = {
  root: resource('AdminPage', AdminPageEntryPoint),
  getPreloadProps: route => ({ queries: { content: { parameters: QUERY_NODE, variables: AdminPageQueryVariables(route), options: { fetchPolicy: 'network-only' } } } }),
};

type Queries = { content: AdminPageQuery };
type Empty = Record<string, never>;
