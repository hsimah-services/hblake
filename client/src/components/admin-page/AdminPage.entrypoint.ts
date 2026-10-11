import { createElement } from 'react';
import { resource, type EntryPointProps, type RouteEntryPoint } from '@tsquid/routes/entrypoint';
import { AdminPage } from './AdminPage';
import { AdminPageListQueryVariables } from './AdminPageListQuery';
import { AdminPageQueryVariables } from './AdminPageQuery';
import { AdminPageCreateQueryVariables } from './AdminPageCreateQuery';
import LIST_NODE, { type AdminPageListQuery } from './__generated__/AdminPageListQuery.graphql';
import QUERY_NODE, { type AdminPageQuery } from './__generated__/AdminPageQuery.graphql';
import CREATE_NODE, { type AdminPageCreateQuery } from './__generated__/AdminPageCreateQuery.graphql';
import type { EntryRoute } from '../../routes/EntryRoute';

export function AdminPageEntryPoint({ queries }: EntryPointProps<Queries, Empty, Empty, Empty>) { return createElement(AdminPage, { list: queries.list, create: queries.create, content: queries.content }); }

// The preloaded operation and variables match routes.json `query`, so inlined initial data answers them.
export const ADMIN_PAGE_ENTRY_POINT: RouteEntryPoint<EntryRoute, Queries, Empty, Empty, Empty> = {
  root: resource('AdminPage', AdminPageEntryPoint),
  getPreloadProps: route => ({ queries: route.mode === 'list'
    ? { list: { parameters: LIST_NODE, variables: AdminPageListQueryVariables(route), options: { fetchPolicy: 'network-only' } } }
    : route.mode === 'create'
      ? { create: { parameters: CREATE_NODE, variables: AdminPageCreateQueryVariables(route), options: { fetchPolicy: 'network-only' } } }
      : { content: { parameters: QUERY_NODE, variables: AdminPageQueryVariables(route), options: { fetchPolicy: 'network-only' } } } }),
};

type Queries = { list?: AdminPageListQuery; create?: AdminPageCreateQuery; content?: AdminPageQuery };
type Empty = Record<string, never>;
